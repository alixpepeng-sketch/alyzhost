import axios from 'axios';
import * as cheerio from 'cheerio';
import { getQuoted, reply } from '../utils.js';
import { logger } from '../logger.js';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

function isSpotifyUrl(url) {
  return /open\.spotify\.com/i.test(String(url || ''));
}

// Ambil URL dari args.raw / args array / reply
function extractUrl(m, args) {
  // 1. args.raw (paling lengkap, dari handler)
  if (typeof args?.raw === 'string' && args.raw.trim()) {
    return args.raw.trim();
  }
  // 2. args array
  if (Array.isArray(args) && args.length) {
    return args.join(' ').trim();
  }
  // 3. reply — pakai getQuoted(m), BUKAN getQuoted(m.message)
  const quoted = getQuoted(m);
  const quotedText =
    quoted?.conversation ||
    quoted?.extendedTextMessage?.text ||
    quoted?.imageMessage?.caption ||
    quoted?.videoMessage?.caption ||
    '';
  return String(quotedText).trim();
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
    spotify: metadata.external_urls?.spotify || spotifyUrl,
    download: convert.data.url,
  };
}

export default async function playdl(sock, m, args) {
  const from = m.key.remoteJid;

  // DEBUG — hapus setelah fix
  console.log('[playdl] args.raw =', JSON.stringify(args?.raw));

  let url = extractUrl(m, args);
  url = String(url).replace(/[\u200B-\u200D\uFEFF<>"'`\n\r]/g, '').trim();

  console.log('[playdl] url =', JSON.stringify(url));
  console.log('[playdl] isSpotify =', isSpotifyUrl(url));

  if (!url || !isSpotifyUrl(url)) {
    return reply(
      sock,
      m,
      'Format:\n.playdl <url spotify>\natau reply pesan yang berisi url spotify dengan .playdl'
    );
  }

  await reply(sock, m, 'Memproses lagu...');

  try {
    const data = await spotifydl(url);
    console.log('[playdl] download link =', data.download);

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
    return reply(sock, m, `Gagal mengunduh: ${err.message}`);
  }
    }
