import sharp from 'sharp';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { buildBratSvg } from '../lib/brat-svg.js';
import { argText, getQuoted, reply } from '../utils.js';
import { logger } from '../logger.js';

const execFileP = promisify(execFile);
const MAX_LENGTH = 200;

// Coba pakai ffmpeg-static, fallback ke ffmpeg sistem.
let FFMPEG_BIN = 'ffmpeg';
try {
  const mod = await import('ffmpeg-static');
  if (mod?.default) FFMPEG_BIN = mod.default;
} catch {
  // ffmpeg-static tidak terpasang, pakai ffmpeg sistem
}

async function renderFrame(text) {
  const svg = await buildBratSvg(text);
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function hasFfmpeg() {
  try {
    await execFileP(FFMPEG_BIN, ['-version']);
    return true;
  } catch {
    return false;
  }
}

// .bratvd <teks> - sticker brat versi video (animated webp).
// Kalau ffmpeg tidak tersedia, otomatis fallback ke sticker statis.
export default async function bratvd(sock, m, args) {
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
    return reply(sock, m, 'Masukkan teksnya. Contoh: .bratvd halo semuanya');
  }
  if (text.length > MAX_LENGTH) {
    return reply(sock, m, `Teks terlalu panjang. Maksimal ${MAX_LENGTH} karakter.`);
  }

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bratvd-'));
  const framePath = path.join(tmpDir, 'frame.png');
  const outPath = path.join(tmpDir, 'out.webp');

  try {
    const frame = await renderFrame(text);
    await fs.writeFile(framePath, frame);

    const ffmpegReady = await hasFfmpeg();

    // Fallback: sticker statis jika ffmpeg tidak tersedia
    if (!ffmpegReady) {
      const webp = await sharp(frame).webp({ quality: 90 }).toBuffer();
      return sock.sendMessage(m.key.remoteJid, { sticker: webp }, { quoted: m });
    }

    // Buat animated webp dengan efek zoom halus
    await execFileP(FFMPEG_BIN, [
      '-y',
      '-loop', '1',
      '-i', framePath,
      '-t', '3',
      '-r', '15',
      '-vf',
      "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:white,zoompan=z='min(zoom+0.0006,1.06)':d=45:s=512x512:fps=15",
      '-c:v', 'libwebp_anim',
      '-lossless', '0',
      '-q:v', '80',
      '-loop', '0',
      '-an',
      '-vsync', '0',
      outPath,
    ]);

    const webp = await fs.readFile(outPath);

    return sock.sendMessage(m.key.remoteJid, { sticker: webp }, { quoted: m });
  } catch (err) {
    logger.error({ err }, 'bratvd gagal');
    // Fallback terakhir: sticker statis
    try {
      const frame = await renderFrame(text);
      const webp = await sharp(frame).webp({ quality: 90 }).toBuffer();
      return sock.sendMessage(m.key.remoteJid, { sticker: webp }, { quoted: m });
    } catch {
      return reply(sock, m, 'Gagal membuat sticker brat video.');
    }
  } finally {
    fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}
