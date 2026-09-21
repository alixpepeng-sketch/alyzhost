import { requireGroupAdmin } from '../lib/groups.js';
import { argText, reply } from '../utils.js';

// Semua perintah di sini: khusus grup, khusus admin grup (atau owner bot),
// dan bot harus admin.
const NEED = { botAdmin: true };

// .setnamegroup <nama baru>
export async function setnamegroup(sock, m, args, sessionDir) {
  const info = await requireGroupAdmin(sock, m, sessionDir, NEED);
  if (!info) return undefined;

  const name = argText(args).replace(/\s+/g, ' ').trim();
  if (!name) return reply(sock, m, 'Masukkan nama baru. Contoh: .setnamegroup Grup Keluarga');
  if (name.length > 100) return reply(sock, m, 'Nama grup maksimal 100 karakter.');

  await sock.groupUpdateSubject(info.jid, name);
  return reply(sock, m, `Nama grup diubah menjadi: ${name}`);
}

// .setdesk <deskripsi baru>
export async function setdesk(sock, m, args, sessionDir) {
  const info = await requireGroupAdmin(sock, m, sessionDir, NEED);
  if (!info) return undefined;

  const text = argText(args);
  if (!text) return reply(sock, m, 'Masukkan deskripsi baru. Contoh: .setdesk Aturan grup ada di sini');
  if (text.length > 2048) return reply(sock, m, 'Deskripsi grup maksimal 2048 karakter.');

  await sock.groupUpdateDescription(info.jid, text);
  return reply(sock, m, 'Deskripsi grup diperbarui.');
}

// .open - semua member boleh kirim pesan
export async function open(sock, m, args, sessionDir) {
  const info = await requireGroupAdmin(sock, m, sessionDir, NEED);
  if (!info) return undefined;

  await sock.groupSettingUpdate(info.jid, 'not_announcement');
  return reply(sock, m, 'Grup dibuka. Semua member bisa mengirim pesan.');
}

// .close - hanya admin yang boleh kirim pesan
export async function close(sock, m, args, sessionDir) {
  const info = await requireGroupAdmin(sock, m, sessionDir, NEED);
  if (!info) return undefined;

  await sock.groupSettingUpdate(info.jid, 'announcement');
  return reply(sock, m, 'Grup ditutup. Hanya admin yang bisa mengirim pesan.');
}

// .revoke - reset link undangan grup
export async function revoke(sock, m, args, sessionDir) {
  const info = await requireGroupAdmin(sock, m, sessionDir, NEED);
  if (!info) return undefined;

  await sock.groupRevokeInvite(info.jid);
  return reply(sock, m, 'Link grup berhasil direset. Link lama tidak berlaku lagi.');
}
