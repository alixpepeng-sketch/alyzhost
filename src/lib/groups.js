import path from 'node:path';
import { logger } from '../logger.js';
import {
  getSenderNumbers,
  isBotParticipant,
  isGroupJid,
  isOwner,
  numberOf,
  participantNumbers,
  readJson,
  reply,
  writeJson,
} from '../utils.js';

/* ------------------------------------------------------------------ */
/* Pengaturan per grup: SESSION_DIR/<nomor>/groups.json */
/* { "<jid grup>": { "antilink": true, "adminonly": false } } */
/* ------------------------------------------------------------------ */

const fileOf = (sessionDir) => path.join(sessionDir, 'groups.json');

function loadAll(sessionDir) {
  const data = readJson(fileOf(sessionDir), {});
  return data && typeof data === 'object' &&!Array.isArray(data)? data : {};
}

export function getGroupSettings(sessionDir, groupJid) {
  return {
    antilink: false,
    adminonly: false,
    accLimit: null, // buat.setacc
    accAuto: false, // buat.acc on/off
   ...(loadAll(sessionDir)[groupJid] || {})
  };
}

export function setGroupSetting(sessionDir, groupJid, key, value) {
  const all = loadAll(sessionDir);
  all[groupJid] = {...(all[groupJid] || {}), [key]: value };
  writeJson(fileOf(sessionDir), all);
}

// INI YANG BIKIN ERROR TADI - SEKARANG UDAH ADA
export function saveGroupSettings(sessionDir, groupJid, settings) {
  const all = loadAll(sessionDir);
  all[groupJid] = {...(all[groupJid] || {}),...settings };
  writeJson(fileOf(sessionDir), all);
}

/* ------------------------------------------------------------------ */
/* Info grup dan hak akses */
/* ------------------------------------------------------------------ */

export async function getGroupInfo(sock, m, sessionDir) {
  const jid = m.key.remoteJid;
  const meta = await sock.groupMetadata(jid);
  const senders = getSenderNumbers(m);

  const senderEntry = meta.participants.find((p) =>
    participantNumbers(p).some((n) => senders.includes(n)),
  );
  const botEntry = meta.participants.find((p) => isBotParticipant(sock, p));

  return {
    jid,
    meta,
    isAdmin: Boolean(senderEntry?.admin) || isOwner(sock, m, sessionDir),
    isBotAdmin: Boolean(botEntry?.admin),
  };
}

export async function requireGroupAdmin(sock, m, sessionDir, { botAdmin = false } = {}) {
  if (!isGroupJid(m.key.remoteJid)) {
    await reply(sock, m, 'Perintah ini hanya bisa dipakai di grup.');
    return null;
  }

  let info;
  try {
    info = await getGroupInfo(sock, m, sessionDir);
  } catch (err) {
    logger.warn({ err: err?.message }, 'gagal mengambil metadata grup');
    await reply(sock, m, 'Gagal mengambil data grup. Coba lagi.');
    return null;
  }

  if (!info.isAdmin) {
    await reply(sock, m, 'Perintah ini khusus admin grup.');
    return null;
  }
  if (botAdmin &&!info.isBotAdmin) {
    await reply(sock, m, 'Jadikan bot sebagai admin grup terlebih dahulu.');
    return null;
  }
  return info;
}

/* ------------------------------------------------------------------ */
/* Antilink */
/* ------------------------------------------------------------------ */

const LINK_REGEX = new RegExp(
  [
    '(?:https?:\\/\\/|www\\.)\\S+',
    '(?:chat\\.whatsapp\\.com|wa\\.me|t\\.me|bit\\.ly|tinyurl\\.com|discord\\.gg)\\/\\S*',
    '(?<![@\\w.-])[a-z0-9][a-z0-9-]*\\.(?:com|net|org|id|io|xyz|info|link|site|online|co|me|app)(?![a-z0-9])(?:\\/\\S*)?',
  ].join('|'),
  'i',
);

export const containsLink = (text) => LINK_REGEX.test(String(text || ''));

export async function enforceAntilink(sock, m, sessionDir, text) {
  const jid = m.key.remoteJid;
  if (!containsLink(text)) return false;
  if (!getGroupSettings(sessionDir, jid).antilink) return false;

  let info;
  try {
    info = await getGroupInfo(sock, m, sessionDir);
  } catch {
    return false;
  }
  if (info.isAdmin ||!info.isBotAdmin) return false;

  try {
    await sock.sendMessage(jid, { delete: m.key });
  } catch (err) {
    logger.warn({ err: err?.message }, 'antilink: gagal menghapus pesan');
    return false;
  }

  const sender = m.key.participantAlt || m.key.participant;
  if (sender) {
    await sock
     .sendMessage(jid, {
        text: `Link tidak diperbolehkan di grup ini, @${numberOf(sender)}.`,
        mentions: [sender],
      })
     .catch(() => {});
  }
  return true;
}
