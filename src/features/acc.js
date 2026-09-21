import { getGroupSettings } from '../lib/groups.js';
import { reply } from '../utils.js';

export async function autoAccCheck(sock, jid, sessionDir) {
  try {
    const s = getGroupSettings(sessionDir, jid);
    if (!s.accAuto) return;
    const limit = s.accLimit || 5;
    const pending = await sock.groupRequestParticipantsList(jid);
    if (pending.length >= limit) {
      const toAcc = pending.slice(0, limit);
      for (const p of toAcc) {
        await sock.groupRequestParticipantsUpdate(jid, [p.jid], 'approve');
        await new Promise(r=>setTimeout(r, 700));
      }
      await sock.sendMessage(jid, { text: `✅ *AUTO ACC ON*\nBerhasil ACC ${toAcc.length} orang (limit ${limit})\nSisa antri: ${pending.length - toAcc.length}` });
    }
  } catch {}
}

export default async function acc(sock, m, args, sessionDir) {
  const jid = m.key.remoteJid;
  const arg = (args[0]||'').toLowerCase();

  if (arg === 'on' || arg === 'off') {
    const { default: setacc } = await import('./setacc.js');
    return setacc(sock, m, args, sessionDir);
  }

  if (arg === 'cek') {
    try {
      const pending = await sock.groupRequestParticipantsList(jid);
      if (!pending.length) return reply(sock, m, 'Antrian kosong.');
      return reply(sock, m, `📋 Antrian ${pending.length} orang:\n` + pending.map((v,i)=> `${i+1}. ${v.jid.split('@')[0]}`).join('\n'));
    } catch { return reply(sock, m, 'Gagal cek, bot harus admin & grup mode approve.'); }
  }

  // ACC MANUAL
  try {
    const pending = await sock.groupRequestParticipantsList(jid);
    if (!pending.length) return reply(sock, m, 'Gak ada yang antri.');
    for (const p of pending) {
      await sock.groupRequestParticipantsUpdate(jid, [p.jid], 'approve');
      await new Promise(r=>setTimeout(r, 700));
    }
    return reply(sock, m, `✅ ACC manual ${pending.length} orang berhasil.`);
  } catch {
    return reply(sock, m, '❌ Gagal. Pastikan bot admin & grup udah aktifin Approve New Members di pengaturan grup.');
  }
}