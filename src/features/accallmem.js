import { requireGroupAdmin } from '../lib/groups.js';

export default async function accallmem(sock, m, args, sessionDir) {
  const info = await requireGroupAdmin(sock, m, sessionDir);
  if (!info) return undefined;
  const { jid } = info;

  // reaction proses 🚀
  await sock.sendMessage(jid, {
    react: { text: '🚀', key: m.key }
  });

  try {
    const requests = await sock.groupRequestParticipantsList(jid);
    
    if (!requests || requests.length === 0) {
      await sock.sendMessage(jid, { text: '✅ Gak ada permintaan bergabung cik.' }, { quoted: m });
      await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
      return;
    }

    let accCount = 0;
    for (let req of requests) {
      await sock.groupRequestParticipantsUpdate(jid, [req.jid], "approve");
      accCount++;
      await new Promise(r => setTimeout(r, 500)); // delay biar gak rate limit
    }

    await sock.sendMessage(jid, { 
      text: `╭───[ ACC ALL MEMBER ]───\n│ 🚀 Berhasil ACC: ${accCount} orang\n│ 🥶 Sisa pending: 0\n╰────────────────` 
    }, { quoted: m });

    // reaction selesai ✅
    await sock.sendMessage(jid, {
      react: { text: '✅', key: m.key }
    });

  } catch (err) {
    console.log(err);
    await sock.sendMessage(jid, { text: `❌ Gagal ACC: ${err.message}` }, { quoted: m });
    await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
  }
}