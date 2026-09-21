import sharp from 'sharp';
import { logger } from '../logger.js';
import { convertBuffer } from '../lib/ffmpeg.js';
import { downloadMedia, findMedia, reply } from '../utils.js';

const SIZE = 512;
const MAX_VIDEO_SECONDS = 6;
const MAX_ANIMATED_BYTES = 950 * 1024;

/* ---------------------------- Foto ---------------------------- */

export function imageToWebp(buffer) {
  return sharp(buffer)
    .resize(SIZE, SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 80 })
    .toBuffer();
}

/* ---------------------------- Video ---------------------------- */
// sharp tidak bisa membaca video, jadi video diubah ke webp animasi lewat ffmpeg.

async function videoToWebp(buffer) {
  let result;
  // Percobaan pertama kualitas lebih baik, kedua lebih ringan bila file kebesaran.
  for (const { fps, quality } of [
    { fps: 12, quality: 45 },
    { fps: 8, quality: 28 },
  ]) {
    const filter =
      `fps=${fps},scale=${SIZE}:${SIZE}:force_original_aspect_ratio=decrease,` +
      `format=rgba,pad=${SIZE}:${SIZE}:(ow-iw)/2:(oh-ih)/2:color=black@0`;
    result = await convertBuffer(buffer, {
      inputExt: 'mp4',
      outputExt: 'webp',
      args: [
        '-t', String(MAX_VIDEO_SECONDS),
        '-an',
        '-vf', filter,
        '-c:v', 'libwebp',
        '-loop', '0',
        '-lossless', '0',
        '-q:v', String(quality),
        '-compression_level', '6',
      ],
    });
    if (result.length <= MAX_ANIMATED_BYTES) break;
  }
  return result;
}

/* ---------------------------- Perintah ---------------------------- */

// .sticker atau .s - foto/video jadi sticker.
export default async function sticker(sock, m) {
  const found = findMedia(m, ['imageMessage', 'videoMessage']);
  if (!found) {
    return reply(
      sock,
      m,
      'Kirim foto/video dengan caption .sticker atau reply foto/video dengan .sticker',
    );
  }

  const isVideo = found.type === 'videoMessage';
  if (isVideo && Number(found.media.seconds) > 60) {
    return reply(sock, m, 'Video terlalu panjang. Gunakan video di bawah 60 detik.');
  }

  const buffer = await downloadMedia(found);
  let webp;
  try {
    webp = isVideo ? await videoToWebp(buffer) : await imageToWebp(buffer);
  } catch (err) {
    logger.warn({ err: err?.message }, 'sticker gagal');
    if (isVideo && err?.code === 'ENOENT') {
      return reply(sock, m, 'Sticker video belum bisa dibuat: ffmpeg tidak tersedia di server.');
    }
    return reply(sock, m, 'Gagal membuat sticker. Coba media lain.');
  }

  return sock.sendMessage(m.key.remoteJid, { sticker: webp }, { quoted: m });
}
