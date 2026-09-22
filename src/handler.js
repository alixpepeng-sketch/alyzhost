import path from 'node:path';
import { commands } from './features/index.js';
import { logger } from './logger.js';
import { enforceAntilink, getGroupInfo, getGroupSettings } from './lib/groups.js';
import { getText, isGroupJid, isOwner, isPlatformOwner, readJson, reply } from './utils.js';
import { cekJawaban } from './features/asahotak.js';
import { handleAntiOs } from './features/antios.js'; // <-- TAMBAHIN INI

export async function handleMessage(sock, m, sessionDir) {
  if (!m?.message ||!m.key?.remoteJid || m.key.remoteJid === 'status@broadcast') return;

  const inGroup = isGroupJid(m.key.remoteJid);

  // ===============================
  // ANTI OS - HARUS PALING ATAS
  // ===============================
  try {
    if (inGroup) {
      const isOs = m.messageStubType === 173 || m.messageStubType === 175 || m.message?.audioChatStartMessage;
      if (isOs) {
        await handleAntiOs(sock, m);
        return; // langsung end, gak usah lanjut cek antilink / command
      }
    }
  } catch {}

  const text = getText(m.message).trim();

  // Antilink berjalan untuk semua pesan grup, bukan hanya perintah.
  if (inGroup &&!m.key.fromMe && (await enforceAntilink(sock, m, sessionDir, text))) return;

  // ===============================
  // ASAH OTAK - CEK JAWABAN TANPA.
  // ===============================
  try {
    if (text &&!text.startsWith('.') && inGroup) {
      await cekJawaban(sock, m, text, sessionDir);
    }
  } catch (e) {
    logger.error({ err: e }, 'asahotak cek gagal');
  }

  const match = text.match(/^\.(\S+)([\s\S]*)$/);
  if (!match) return;

  const command = match[1].toLowerCase();
  if (!Object.hasOwn(commands, command)) return;

  // Selfmode
  const selfmode = readJson(path.join(sessionDir, 'selfmode.json'), {})?.selfmode === true;
  if (selfmode &&!isOwner(sock, m, sessionDir) &&!isPlatformOwner(m)) return;

  // Adminonly
  if (inGroup && getGroupSettings(sessionDir, m.key.remoteJid).adminonly &&!isOwner(sock, m, sessionDir)) {
    try {
      if (!(await getGroupInfo(sock, m, sessionDir)).isAdmin) return;
    } catch {
      return;
    }
  }

  const raw = match[2].trim();
  const args = raw? raw.split(/\s+/) : [];
  args.raw = raw;

  try {
    await commands[command](sock, m, args, sessionDir);
  } catch (err) {
    logger.error({ err, command }, 'perintah gagal');
    try {
      await reply(sock, m, 'Terjadi kesalahan saat menjalankan perintah.');
    } catch {
      /* koneksi mungkin sedang putus */
    }
  }
}
