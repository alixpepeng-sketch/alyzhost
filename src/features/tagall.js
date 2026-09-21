import { requireGroupAdmin } from '../lib/groups.js';
import { argText, isBotParticipant, numberOf, sleep } from '../utils.js';

const CHUNK_SIZE = 100; // batas mention per pesan supaya pesan tidak terlalu besar
const CHUNK_DELAY_MS = 1000;

// .tagall [pesan] - tag semua member grup. Khusus admin grup dan owner bot.
export default async function tagall(sock, m, args, sessionDir) {
  const info = await requireGroupAdmin(sock, m, sessionDir);
  if (!info) return undefined;

  const { jid, meta } = info;
  const members = meta.participants
    .filter((p) => !isBotParticipant(sock, p))
    .map((p) => p.phoneNumber || p.id);

  const note = argText(args);
  const header = `——[ALYZ ${meta.subject}]——\n${note ? `${note}\n` : ''}\n`;

  for (let i = 0; i < members.length; i += CHUNK_SIZE) {
    const chunk = members.slice(i, i + CHUNK_SIZE);
    const lines = chunk.map((member, k) => `${i + k + 1}. @${numberOf(member)}`);
    const text = (i === 0 ? header : '') + lines.join('\n');

    await sock.sendMessage(jid, { text, mentions: chunk }, i === 0 ? { quoted: m } : undefined);
    if (i + CHUNK_SIZE < members.length) await sleep(CHUNK_DELAY_MS);
  }
  return undefined;
}
