import axios from 'axios';
import crypto from 'node:crypto';
import { argText, reply } from '../utils.js';
import { logger } from '../logger.js';

let cachedToken = null;
let tokenExpiry = 0;

const CLIENT_ID = 'acc6302297e040aeb6e4ac1fbdfd62c3';
const CLIENT_SECRET = '0e8439a1280a43aba9a5bc0a16f3f009';
const BASIC_AUTH = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

const http = axios.create({
  timeout: 15000,
  headers: { 'User-Agent': 'AlyzBot/1.0' },
});

function isSpotifyUrl(url) {
  return /^https:\/\/open\.spotify\.com\/.*\/\w+/i.test(String(url || ''));
}

async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiry) return cachedToken;

  const { data } = await http.post(
    'https://accounts.spotify.com/api/token',
    'grant_type=client_credentials',
    {
      headers: {
        Authorization: `Basic ${BASIC_AUTH}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  cachedToken = data.access_token;
  tokenExpiry = now + (data.expires_in - 60) * 1000;
  return cachedToken;
}

async function searchITunes(query) {
  const { data } = await http.get('https://itunes.apple.com/search', {
    params: { term: query, media: 'music', limit: 5 },
  });

  return (data.results || []).map((r) => ({
    title: r.trackName,
    artist: r.artistName,
    link: r.trackViewUrl,
    thumbnail: r.artworkUrl100,
  }));
}

async function searchSpotify(query) {
  try {
    const token = await getAccessToken();
    const { data } = await http.get('https://api.spotify.com/v1/search', {
      params: { q: query, type: 'track', limit: 5 },
      headers: { Authorization: `Bearer ${token}` },
    });

    return (data.tracks?.items || []).map((item) => ({
      title: item.name,
      artist: item.artists.map((a) => a.name).join(', '),
      link: item.external_urls.spotify,
      thumbnail: item.album.images?.[0]?.url,
    }));
  } catch (err) {
    logger.warn({ err: err.message }, 'Spotify gagal, fallback ke iTunes');
    return searchITunes(query);
  }
}

async function spotifyDownload(url) {
  const client = axios.create({
    baseURL: 'https://spotisongdownloader.to',
    timeout: 25000,
    headers: {
      'Accept-Encoding': 'gzip, deflate, br',
      'Content-Type': 'application/x-www-form-urlencoded',
      referer: 'https://spotisongdownloader.to',
      cookie: `PHPSESSID=${crypto.randomBytes(16).toString('hex')}`,
    },
  });

  const [metaRes] = await Promise.all([
    client.get('/api/composer/spotify/xsingle_track.php', {
      params: { url },
    }),
    client.post('/track.php').catch(() => {}),
  ]);

  const meta = metaRes.data;

  const { data: dl } = await client.post(
    '/api/composer/spotify/ssdw23456ytrfds.php',
    new URLSearchParams({
      url,
      zip_download: 'false',
      quality: 'm4a',
    }).toString()
  );

  if (!dl || !dl.dlink) throw new Error('Download link tidak ditemukan');

  return {
    title: meta.song_name || 'Unknown',
    artist: meta.artist || 'Unknown',
    cover: meta.img,
    download: dl.dlink,
    source: url,
  };
}

export default async function play(sock, m, args) {
  const input = argText(args).trim();
  const from = m.key.remoteJid;

  if (!input) {
    return reply(sock, m, 'Format:\n.play <judul lagu>\n.play <url spotify>');
  }

  if (isSpotifyUrl(input)) {
    await reply(sock, m, 'Memproses lagu...');

    try {
      const data = await spotifyDownload(input);

      await sock.sendMessage(
        from,
        {
          image: { url: data.cover },
          caption: `Judul: ${data.title}\nArtis: ${data.artist}`,
        },
        { quoted: m }
      );

      await sock.sendMessage(
        from,
        {
          audio: { url: data.download },
          mimetype: 'audio/mp4',
          fileName: `${data.title}.m4a`,
        },
        { quoted: m }
      );
      return;
    } catch (err) {
      logger.error({ err: err.message }, 'play download gagal');
      return reply(sock, m, 'Gagal mengunduh lagu. Coba lagi.');
    }
  }

  try {
    const results = await searchSpotify(input);
    if (!results.length) return reply(sock, m, 'Lagu tidak ditemukan.');

    const lines = results
      .map((r, i) => `${i + 1}. ${r.title}\n   ${r.artist}\n   ${r.link}`)
      .join('\n\n');

    const text = `╭─── SPOTIFY SEARCH ───╮\n\n${lines}\n\n╰──────────────────────╯\n\nKirim .play <url spotify> untuk mengunduh.`;
    return reply(sock, m, text);
  } catch (err) {
    logger.error({ err: err.message }, 'play search gagal');
    return reply(sock, m, `Gagal mencari lagu: ${err.message}`);
  }
    }
