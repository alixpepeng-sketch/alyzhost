import axios from 'axios';
import * as cheerio from 'cheerio';
import { logger } from '../logger.js';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

function pickUrl(m, args) {
  if (args && typeof args.raw === 'string' && args.raw.trim()) {
    return args.raw.trim();
  }
  if (Array.isArray(args) && args.length) {
    return args.join(' ').trim();
  }

  const msg = m?.message || {};
  let ctx = null;

  for (const key of Object.keys(msg)) {
    const v = msg[key];
    if (v && typeof v === 'object' && v.contextInfo) {
      ctx = v.contextInfo;
      break;
    }
  }

  if (!ctx?.quotedMessage) return '';

  const q = ctx.quotedMessage;
  return (
    q.conversation ||
    q.extendedTextMessage?.text ||
    q.imageMessage?.caption ||
    q.videoMessage?.caption ||
    q.documentMessage?.caption ||
    ''
  ).trim();
}

async function spotifydl(spotifyUrl) {
  const home = await axios.get('https://spotmate.online/en1', {
    timeout: 15000,
    headers: { 'User-Agent': USER_AGENT },
  });

  const cookies = home.headers['set-cookie'] || [];
  const cookieString = cookies.map((v) => v.split(';')[0]).join('; ');

  const $ = cheerio.load(home.data);

  let csrf =
    $('meta[name="csrf-token"]').attr('content') ||
    $('meta[name="_token"]').attr('content');

  if (!csrf) {
    const match = home.data.match(/csrf-token["']?\s*content=["']([^"']+)/);
    if (match) csrf = match[1];
  }

  if (!csrf) throw new Error('CSRF token tidak ditemukan');

  const headers = {
    'User-Agent': USER_AGENT,
    Origin: 'https://spotmate.online',
    Referer: 'https://spotmate.online/en1',
    'Content-Type': 'application/json',
    'X-CSRF-TOKEN': csrf,
    Cookie: cookieString,
  };

  const trackData = await axios.post(
    'https://spotmate.online/getTrackData',
    { spotify_url: spotifyUrl },
    { headers, timeout: 15000 }
  );

  const metadata = trackData.data;

  const convert = await axios.post(
    'https://spotmate.online/convert',
    { urls: spotifyUrl },
    { headers, timeout: 25000 }
  );

  if (convert.data?.error) throw new Error('Convert gagal');

  return {
    title: metadata.name || 'Unknown',
    artist: metadata.artists?.map((v) => v.name).join(', ') || '-',
    thumbnail: metadata.album?.images?.[0]?.url,
    download: convert.data.url,
  };
}

export default async function playdl(sock, m, args) {
  const from = m.key.remoteJid;

  // ==== DEBUG WAJIB — JANGAN DIHAPUS DULU ====
  console.log('===== PLAYDL =====');
  console.log('RAW TEXT:', JSON.stringify(m.message?.extendedTextMessage?.text));
  console.log('ARGS:', JSON.stringify(args));
  console.log('ARGS.RAW:', JSON.stringify(args?.raw));

  let url = pickUrl(m, args);
  url = String(url).replace(/[\u200B-\u200D\uFEFF]/g, '').trim();

  console.log('FINAL URL:', JSON.stringify(url));
  console.log('MATCH SPOTIFY:', /open\.spotify\.com/i.test(url));
  console.log('==================');

  if (!url || !/open\.spotify\.com/i.test(url)) {
    return sock.sendMessage(
      from,
      {
        text:
          'Format:\n.playdl <url spotify>\natau reply pesan berisi url spotify dengan .playdl',
      },
      { quoted: m }
    );
  }

  await sock.sendMessage(from, { text: 'Memproses lagu...' }, { quoted: m });

  try {
    const data = await spotifydl(url);

    if (data.thumbnail) {
      await sock.sendMessage(
        from,
        {
          image: { url: data.thumbnail },
          caption: `Judul: ${data.title}\nArtis: ${data.artist}\n\nMengirim audio...`,
        },
        { quoted: m }
      );
    }

    await sock.sendMessage(
      from,
      {
        audio: { url: data.download },
        mimetype: 'audio/mp4',
        fileName: `${data.title}.m4a`,
      },
      { quoted: m }
    );
  } catch (err) {
    logger.error({ err: err.message }, 'playdl gagal');
    await sock.sendMessage(
      from,
      { text: `Gagal: ${err.message}` },
      { quoted: m }
    );
  }
    }
