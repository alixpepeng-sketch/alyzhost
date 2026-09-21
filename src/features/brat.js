import sharp from 'sharp';
import { buildBratSvg } from '../lib/brat-svg.js';
import { argText, getQuoted, reply } from '../utils.js';
import { logger } from '../logger.js';

const MAX_LENGTH = 200;

// .brat <teks> - sticker brat: latar putih, teks hitam tebal San Francisco,
// emoji gaya iPhone, watermark ALYZ BOT di bagian bawah.
// Kalau teks kosong, teks diambil dari pesan yang di-reply.
export default async function brat(sock, m, args) {
  let text = argText(args);

  if (!text) {
    const quoted = getQuoted(m.message);
    text =
      quoted?.conversation ||
      quoted?.extendedTextMessage?.text ||
      quoted?.imageMessage?.caption ||
      quoted?.videoMessage?.caption ||
      '';
  }

  text = String(text).replace(/\s+/g, ' ').trim();
  if (!text) {
    return reply(sock, m, 'Masukkan teksnya. Contoh: .brat halo semuanya');
  }
  if (text.length > MAX_LENGTH) {
    return reply(sock, m, `Teks terlalu panjang. Maksimal ${MAX_LENGTH} karakter.`);
  }

  try {
    const svg = await buildBratSvg(text);
    const webp = await sharp(Buffer.from(svg))
      .resize(512, 512)
      .webp({ quality: 90 })
      .toBuffer();

    return sock.sendMessage(m.key.remoteJid, { sticker: webp }, { quoted: m });
  } catch (err) {
    logger.error({ err }, 'brat gagal');
    return reply(sock, m, 'Gagal membuat sticker brat.');
  }
}
