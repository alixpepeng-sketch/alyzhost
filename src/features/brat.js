import sharp from 'sharp';
import { buildBratSvg } from '../lib/brat-svg.js';
import { argText, getQuoted, reply } from '../utils.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const MAX_LENGTH = 200;

async function writeExif(webpBuffer, packname, author) {
  try {
    const { Image } = await import('node-webpmux');
    const tmpInput = path.join(os.tmpdir(), `brat_${Date.now()}_in.webp`);
    const tmpOutput = path.join(os.tmpdir(), `brat_${Date.now()}_out.webp`);
    await fs.writeFile(tmpInput, webpBuffer);
    const img = await Image.load(tmpInput);
    const exif = {
      "sticker-pack-id": "alyz-pack",
      "sticker-pack-name": packname,
      "sticker-pack-publisher": author,
      "emojis": [""]
    };
    img.exif = Buffer.from(JSON.stringify(exif));
    await img.save(tmpOutput);
    const out = await fs.readFile(tmpOutput);
    await fs.unlink(tmpInput).catch(()=>{});
    await fs.unlink(tmpOutput).catch(()=>{});
    return out;
  } catch {
    return webpBuffer; // kalo module gak ada tetep jalan
  }
}

export default async function brat(sock, m, args) {
  let text = argText(args);
  if (!text) {
    const quoted = getQuoted(m);
    text = quoted?.conversation || quoted?.extendedTextMessage?.text || '';
  }
  text = text.replace(/\s+/g, ' ').trim();
  if (!text) return reply(sock, m, 'Masukkan teksnya. Contoh: .brat halo semuanya');
  if (text.length > MAX_LENGTH) return reply(sock, m, `Teks kepanjangan cik, max ${MAX_LENGTH} karakter.`);

  let webp = await sharp(Buffer.from(buildBratSvg(text)))
    .resize(512, 512, { fit: 'contain', background: '#ffffff' })
    .webp({ quality: 100 })
    .toBuffer();

  // ini yang bikin WM jadi Alyz / Alyz Bot di info stiker
  webp = await writeExif(webp, 'Alyz', 'Alyz Bot');

  return sock.sendMessage(m.key.remoteJid, { sticker: webp }, { quoted: m });
  }
