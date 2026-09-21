import fs from 'node:fs';
import path from 'node:path';
import { reply, isAdmin } from '../utils.js';

const DB_PATH = path.join(process.cwd(), 'data', 'antios.json');

function loadDB() {
  try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')); }
  catch { return {}; }
}
function saveDB(db) {
  if (!fs.existsSync(path.dirname(DB_PATH))) fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export default async function antios(sock, m, args) {
  if (!m.key.remoteJid.endsWith('@g.us')) return reply(sock, m, 'Cuma buat grup cik.');
  if (!await isAdmin(m)) return reply(sock, m, 'Cuma admin yang bisa setting.');

  const act = (args[0]||'').toLowerCase();
  const db = loadDB();
  const id = m.key.remoteJid;

  if (act === 'on') {
    db[id] = true; saveDB(db);
    return reply(sock, m, '✅ Anti OS AKTIF\nSekarang obrolan audio auto gue matiin tanpa kick 🗿');
  }
  if (act === 'off') {
    delete db[id]; saveDB(db);
    return reply(sock, m, '❌ Anti OS MATI');
  }
  return reply(sock, m, `*ANTI OBROLAN AUDIO*\nStatus: ${db[id]?'AKTIF':'MATI'}\n\n*.antios on* / *.antios off*`);
}

export async function handleAntiOs(sock, m) {
  try {
    const db = loadDB();
    if (!db[m.key.remoteJid]) return;

    const stub = m.messageStubType;
    // 173 = mulai os, 175 = join os
    const isOs = stub === 173 || stub === 175;

    if (isOs) {
      const pelaku = m.key.participant || m.participant || '';

      // 1. Matikan paksa audio chat via IQ query (ini yang bikin os nya ke-end)
      await sock.query({
        tag: 'iq',
        attrs: { type: 'set', xmlns: 'w:g2', to: m.key.remoteJid },
        content: [{ tag: 'audio_chat', attrs: { action: 'end' } }]
      }).catch(()=>{});

      // 2. Kasih warning aja, tanpa kick
      await sock.sendMessage(m.key.remoteJid, {
        text: `🗿 Dilarang os di grup ini @${pelaku.split('@')[0]}. Obrolan audio gue matiin otomatis.`,
        mentions: pelaku? [pelaku] : []
      });
    }
  } catch {}
}