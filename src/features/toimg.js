import sharp from 'sharp';
import { downloadMedia, findMedia, reply } from '../utils.js';

// .toimg - ubah sticker jadi foto. Reply sticker dengan .toimg.
export default async function toimg(sock, m) {
  const found = findMedia(m, ['stickerMessage']);
  if (!found) return reply(sock, m, 'Reply sticker dengan .toimg');

  const webp = await downloadMedia(found);
  const png = await sharp(webp).png().toBuffer();

  const caption = found.media.isAnimated ? 'Sticker animasi, hanya frame pertama yang diambil.' : '';
  return sock.sendMessage(m.key.remoteJid, { image: png, caption }, { quoted: m });
}
