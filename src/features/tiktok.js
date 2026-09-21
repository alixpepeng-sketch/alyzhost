import axios from 'axios';
import { logger } from '../logger.js';
import { argText, getQuoted, reply } from '../utils.js';

// Layanan pihak ketiga (tikwm). Kalau berhenti bekerja, ganti di sini.
const API_URL = 'https://www.tikwm.com/api/';
const API_ORIGIN = 'https://www.tikwm.com';
const TIKTOK_URL = /https?:\/\/(?:[\w-]+\.)?tiktok\.com\/\S+/i;
const MAX_VIDEO_BYTES = 60 * 1024 * 1024;

const absolute = (url) => (url?.startsWith('/') ? `${API_ORIGIN}${url}` : url);

// .tiktok <link> - download video TikTok tanpa watermark.
// Link juga bisa diambil dari pesan yang di-reply.
export default async function tiktok(sock, m, args) {
  const quoted = getQuoted(m);
  const source = `${argText(args)} ${quoted?.conversation || quoted?.extendedTextMessage?.text || ''}`;
  const link = source.match(TIKTOK_URL)?.[0];

  if (!link) {
    return reply(sock, m, 'Kirim link TikTok. Contoh: .tiktok https://vt.tiktok.com/xxxx');
  }

  await reply(sock, m, 'Mengunduh video TikTok...');

  let info;
  try {
    const { data } = await axios.get(API_URL, {
      params: { url: link, hd: 1 },
      timeout: 30_000,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (data?.code !== 0 || !data?.data) {
      return reply(sock, m, 'Video tidak ditemukan atau bersifat privat.');
    }
    info = data.data;
  } catch (err) {
    logger.warn({ err: err?.message }, 'tiktok: gagal menghubungi layanan');
    return reply(sock, m, 'Gagal menghubungi layanan download. Coba lagi nanti.');
  }

  if (Array.isArray(info.images) && info.images.length && !info.play) {
    return reply(sock, m, 'Postingan foto (slideshow) belum didukung. Kirim link video.');
  }

  const videoUrl = absolute(info.hdplay || info.play);
  if (!videoUrl) return reply(sock, m, 'Link video tidak tersedia.');

  let video;
  try {
    const res = await axios.get(videoUrl, {
      responseType: 'arraybuffer',
      timeout: 90_000,
      maxContentLength: MAX_VIDEO_BYTES,
      maxBodyLength: MAX_VIDEO_BYTES,
    });
    video = Buffer.from(res.data);
  } catch (err) {
    logger.warn({ err: err?.message }, 'tiktok: gagal mengunduh video');
    return reply(sock, m, 'Gagal mengunduh video. Ukurannya mungkin terlalu besar.');
  }

  const author = info.author?.unique_id ? `@${info.author.unique_id}` : '';
  const caption = [info.title, author].filter(Boolean).join('\n').slice(0, 900);

  return sock.sendMessage(
    m.key.remoteJid,
    { video, mimetype: 'video/mp4', caption },
    { quoted: m },
  );
}
