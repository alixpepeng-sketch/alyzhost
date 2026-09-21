import sharp from 'sharp';
import { buildBratSvg } from '../lib/brat-svg.js';
import { argText, getQuoted, reply } from '../utils.js';

const MAX_LENGTH = 200;

function addExif(webpBuffer, packname, author) {
  const json = {
    "sticker-pack-id": "alyz.brat",
    "sticker-pack-name": packname,
    "sticker-pack-publisher": author,
    "sticker-pack-publisher-id": "alyz",
    "emojis": ["🖤"]
  };
  const jsonStr = JSON.stringify(json);
  const jsonBuff = Buffer.from(jsonStr, 'utf-8');
  
  const exifAttr = Buffer.from([
    0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57,
    0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00
  ]);
  const exif = Buffer.concat([exifAttr, jsonBuff]);
  exif.writeUIntLE(jsonBuff.length, 14, 4);

  // bikin chunk EXIF buat WEBP
  const exifChunk = Buffer.concat([
    Buffer.from('EXIF', 'ascii'),
    Buffer.alloc(4),
    exif
  ]);
  exifChunk.writeUInt32LE(exif.length, 4);

  // sisipin EXIF setelah header RIFF/WEBP (12 byte)
  const header = webpBuffer.slice(0, 12);
  const data = webpBuffer.slice(12);
  const newBuffer = Buffer.concat([header, exifChunk, data]);
  
  // update ukuran RIFF
  newBuffer.writeUInt32LE(newBuffer.length - 8, 4);
  return newBuffer;
}

export default async function brat(sock, m, args) {
  let text = argText(args);
  if (!text) {
    const quoted = getQuoted(m);
    text = quoted?.conversation || quoted?.extendedTextMessage?.text || '';
  }
  text = text.replace(/\s+/g, ' ').trim();
  if (!text) return reply(sock, m, 'Masukkan teksnya. Contoh: .brat halo semuanya');
  if (text.length > MAX_LENGTH) return reply(sock, m, `Teks kepanjangan, max ${MAX_LENGTH} karakter.`);

  let webp = await sharp(Buffer.from(buildBratSvg(text)))
    .resize(512, 512)
    .webp({ quality: 100 })
    .toBuffer();

  // INI KUNCINYA - inject pack Alyz / Alyz Bot
  webp = addExif(webp, 'Alyz', 'Alyz Bot');

  return sock.sendMessage(m.key.remoteJid, { sticker: webp }, { quoted: m });
                                   }
