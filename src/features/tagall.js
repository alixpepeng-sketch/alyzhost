import { requireGroupAdmin } from '../lib/groups.js';
import { argText, isBotParticipant, numberOf, sleep } from '../utils.js';

const CHUNK_SIZE = 100;
const CHUNK_DELAY_MS = 1000;

//.tagall [pesan] - tag semua member grup. Khusus admin grup dan owner bot.
export default async function tagall(sock, m, args, sessionDir) {
  const info = await requireGroupAdmin(sock, m, sessionDir);
  if (!info) return undefined;
  const { jid, meta } = info;

  // reaction proses 🚀
  await sock.sendMessage(jid, {
    react: { text: '🚀', key: m.key }
  });

  const members = meta.participants
   .filter((p) =>!isBotParticipant(sock, p))
   .map((p) => p.phoneNumber || p.id);

  const note = argText(args) || 'Tag All Member';

  for (let i = 0; i < members.length; i += CHUNK_SIZE) {
    const chunk = members.slice(i, i + CHUNK_SIZE);

    let text = '';
    if (i === 0) {
      text += `╭───[ TAG ALL - ${meta.subject} ]───\n`;
      text += `│ 🚀 Pesan: ${note}\n`;
      text += `│ 🥶 Member: ${members.length} orang\n`;
      text += `├────────────────\n`;
    }

    const lines = chunk.map((member, k) => `│ ${i + k + 1}. @${numberOf(member)}`);
    text += lines.join('\n');

    if (i + CHUNK_SIZE >= members.length) {
      text += `\n╰────────────────`;
    }

    await sock.sendMessage(jid, { text, mentions: chunk }, i === 0? { quoted: m } : undefined);
    if (i + CHUNK_SIZE < members.length) await sleep(CHUNK_DELAY_MS);
  }

  // reaction selesai ✅
  await sock.sendMessage(jid, {
    react: { text: '✅', key: m.key }
  });

  return undefined;
                                }
