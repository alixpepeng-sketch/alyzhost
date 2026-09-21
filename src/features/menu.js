import { reply } from '../utils.js';

// Daftar fitur. Sengaja tidak memuat .menu itu sendiri.
const FEATURES = [
  '.rvo',
  '.selfmode',
  '.toptv',
  '.fotolive',
  '.kickall',
  '.removebg',
  '.sticker',
  '.brat',
  '.setwelcome',
  '.setleave',
  '.welcome',
  '.leave',
  '.ai',
  '.getpp',
  '.tiktok',
  '.tomp3',
  '.tagall',
  '.toimg',
  '.setnamegroup',
  '.setdesk',
  '.open',
  '.close',
  '.revoke',
  '.antilink',
  '.adminonly',
  '.balikinjf',
  '.amsend',
  '.amverif',
];

export default async function menu(sock, m) {
  const body = FEATURES.map((name) => `│ • ${name}`).join('\n');
  const text = `╭───[ AlyzBot ]───\n${body}\n╰───────────────`;
  await reply(sock, m, text);
}