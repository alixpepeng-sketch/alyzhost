import { getContextInfo, numberOf, sleep } from '../utils.js';

const SONG = 'Justfrend Kok Jatuh Suka Raim Laode';
const YOUTUBE = `https://www.youtube.com/results?search_query=${encodeURIComponent(SONG)}`;
const SPOTIFY = `https://open.spotify.com/search/${encodeURIComponent(SONG)}`;

// .balikinjf - prank. Kalau dipakai sambil tag atau reply seseorang, orang itu ikut di-mention.
// Lagunya tidak dikirim sebagai file audio karena berhak cipta; yang dikirim link pencarian
// ke layanan streaming resmi.
export default async function balikinjf(sock, m) {
  const chat = m.key.remoteJid;
  const ctx = getContextInfo(m.message);
  const target = ctx?.mentionedJid?.[0] || (ctx?.quotedMessage ? ctx.participant : undefined);

  const prefix = target ? `@${numberOf(target)} ` : '';
  await sock.sendMessage(
    chat,
    {
      text: `${prefix}Lah masih berharap sama justfrend? cuma justfrend kok jatuh cinta`,
      mentions: target ? [target] : [],
    },
    { quoted: m },
  );

  await sleep(1500);
  await sock.sendMessage(chat, {
    text: `Justfrend Kok Jatuh Suka - Raim Laode\nDengarkan lewat layanan resmi:\nYouTube: ${YOUTUBE}\nSpotify: ${SPOTIFY}`,
  });
}
