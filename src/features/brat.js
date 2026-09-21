import sharp from 'sharp';
import { buildBratSvg } from '../lib/brat-svg.js';
import { argText, getQuoted, reply } from '../utils.js';

const MAX_LENGTH = 200;

function addExif(webpSticker, packname, author) {
  const json = {
    "sticker-pack-id": "com.alyz",
    "sticker-pack-name": packname,
    "sticker-pack-publisher": author,
    "emojis": [""]
  };
  const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
  const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf-8');
  const exif = Buffer.concat([exifAttr, jsonBuffer]);
  exif.writeUIntLE(jsonBuffer.length, 14, 4);

  const header = webpSticker.slice(0, 12);
  let data = webpSticker.slice(12);

  // bikin chunk EXIF yang valid
  const exifChunk = Buffer.alloc(exif.length + 8);
  exifChunk.write('EXIF', 0);
  exifChunk.writeUInt32LE(exif.length, 4);
  exif.set(exifChunk, 8);

  // gabung + padding genap (aturan WEBP)
  let newData = Buffer.concat([exifChunk, data]);
  if (newData.length % 2 === 1) {
    newData = Buffer.concat([newData, Buffer.from([0x00])]);
  }

  const newHeader = Buffer.alloc(12);
  header.copy(newHeader, 0, 0, 12);
  newHeader.writeUInt32LE(newData.length + 4, 4); // RIFF size = WEBP(4) + chunks

  return Buffer.concat([newHeader, newData]);
}

export default async function brat(sock, m, args) {
  let text = argText(args);
  if (!text) {
    const quoted = getQuoted(m);
    text = quoted?.conversation || quoted?.extendedTextMessage?.text || '';
  }
  text = text.replace(/\s+/g, ' ').trim();
  if (!text) return reply(sock, m, 'Masukkan teksnya. Contoh:.brat halo semuanya');
  if (text.length > MAX_LENGTH) return reply(sock, m, `Teks kepanjangan, max ${MAX_LENGTH} karakter.`);

  const svg = buildBratSvg(text);
  let webp = await sharp(Buffer.from(svg))
   .resize(512, 512)
   .webp()
   .toBuffer();

  webp = addExif(webp, 'Alyz', 'Alyz Bot');

  return sock.sendMessage(m.key.remoteJid, { sticker: webp }, { quoted: m });
}
