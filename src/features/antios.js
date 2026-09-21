import fs from 'node:fs';
import path from 'node:path';
import { reply } from '../utils.js';
import { getGroupInfo } from '../lib/groups.js';

const DB_PATH = path.join(process.cwd(), 'data', 'antios.json');

function loadDB() {
  try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')); }
  catch { return {}; }
}
function saveDB(db) {
  if (!fs.existsSync(path.dirname(DB_PATH))) fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

async function checkAdmin(sock, m, sessionDir) {
  try {
    const info = await getGroupInfo(sock, m, sessionDir);
    return info.isAdmin;
  } catch { return false; }
}

export default async function antios(sock, m, args, sessionDir) {
  if (!m.key.remoteJid.endsWith('@g.us')) return reply(sock, m, 'Cuma buat grup cik.');
  if (!await checkAdmin(sock, m, sessionDir)) return reply(sock, m, 'Cuma admin yang bisa setting.');

  const act = (args[0]||'').toLowerCase();
  const db = loadDB();
  const id = m.key.remoteJid;

  if (act === 'on') {
    db[id] = true; saveDB(db);
    return reply(sock, m, '✅ Anti OS AKTIF - os auto gue matiin tanpa kick');
  }
  if (act === 'off') {
    delete db[id]; saveDB(db);
    return reply(sock, m, '❌ Anti OS MATI');
  }
  return reply(sock, m, `*ANTI OS*\nStatus: ${db[id]?'AKTIF':'MATI'}\n\n*.antios on* / *.antios off*`);
}

export async function handleAntiOs(sock, m) {
  try {
    const db = loadDB();
    if (!db[m.key.remoteJid]) return;
    const stub = m.messageStubType;
    const isOs = stub === 173 || stub === 175;
    if (isOs) {
      const pelaku = m.key.participant || m.participant || '';
      await sock.query({
        tag: 'iq',
        attrs: { type: 'set', xmlns: 'w:g2', to: m.key.remoteJid },
        content: [{ tag: 'audio_chat', attrs: { action: 'end' } }]
      }).catch(()=>{});
      await sock.sendMessage(m.key.remoteJid, {
        text: `🗿 Dilarang os @${pelaku.split('@')[0]}. Obrolan audio gue matiin.`,
        mentions: pelaku? [pelaku] : []
      });
    }
  } catch {}
    }
