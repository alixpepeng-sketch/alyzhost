import { convertBuffer } from '../lib/ffmpeg.js';
import { logger } from '../logger.js';
import { downloadMedia, findMedia, reply } from '../utils.js';

// .tomp3 - ambil suara dari video. Upload video dengan caption .tomp3 atau reply video.
export default async function tomp3(sock, m) {
  const found = findMedia(m, ['videoMessage']);
  if (!found) {
    return reply(sock, m, 'Upload video dengan caption .tomp3 atau reply video dengan .tomp3');
  }

  const buffer = await downloadMedia(found);

  let mp3;
  try {
    mp3 = await convertBuffer(buffer, {
      inputExt: 'mp4',
      outputExt: 'mp3',
      args: ['-vn', '-c:a', 'libmp3lame', '-q:a', '4'],
    });
  } catch (err) {
    logger.warn({ err: err?.message }, 'tomp3 gagal');
    if (err?.code === 'ENOENT') {
      return reply(sock, m, 'Fitur ini belum bisa dipakai: ffmpeg tidak tersedia di server.');
    }
    return reply(sock, m, 'Gagal mengambil suara. Pastikan videonya punya audio.');
  }

  return sock.sendMessage(
    m.key.remoteJid,
    { audio: mp3, mimetype: 'audio/mpeg' },
    { quoted: m },
  );
}
