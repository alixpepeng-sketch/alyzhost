import { argText, getContextInfo, isGroupJid, normalizeNumber, reply } from '../utils.js';

// .getpp - ambil foto profil orang lain.
// Target dicari berurutan: tag (@user), nomor di argumen, pengirim pesan yang
// di-reply, lalu lawan bicara kalau dipakai di chat pribadi.
export default async function getpp(sock, m, args) {
  const chat = m.key.remoteJid;
  const ctx = getContextInfo(m.message);

  let target = ctx?.mentionedJid?.[0];

  const typed = argText(args);
  if (!target && typed) {
    // Nomor boleh ditulis dengan spasi atau tanda hubung.
    const number = normalizeNumber(typed);
    if (!number) {
      return reply(sock, m, 'Nomor tidak valid. Contoh: .getpp 6281234567890');
    }
    target = `${number}@s.whatsapp.net`;
  }
  if (!target && ctx?.quotedMessage) target = ctx.participant;
  if (!target && !isGroupJid(chat)) target = chat;

  if (!target) {
    return reply(
      sock,
      m,
      'Tag orangnya, reply pesannya, atau tulis nomornya.\nContoh: .getpp @user atau .getpp 6281234567890',
    );
  }

  let url;
  try {
    url = await sock.profilePictureUrl(target, 'image');
  } catch {
    return reply(sock, m, 'Foto profil tidak ditemukan atau disembunyikan oleh pemiliknya.');
  }
  if (!url) {
    return reply(sock, m, 'Foto profil tidak ditemukan atau disembunyikan oleh pemiliknya.');
  }

  return sock.sendMessage(chat, { image: { url } }, { quoted: m });
}
