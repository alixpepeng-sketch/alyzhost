import { getGroupSettings, saveGroupSettings } from '../lib/groups.js';
import { reply } from '../utils.js';

export default async function setacc(sock, m, args, sessionDir) {
  const jid = m.key.remoteJid;
  const settings = getGroupSettings(sessionDir, jid);
  const arg = (args[0]||'').toLowerCase();

  if (arg === 'on' || arg === 'off') {
    settings.accAuto = arg === 'on';
    saveGroupSettings(sessionDir, jid, settings);
    return reply(sock, m, `✅ Auto ACC *${arg.toUpperCase()}*\nLimit: ${settings.accLimit || 5} orang`);
  }

  const num = parseInt(args[0]);
  if (!num || isNaN(num)) {
    return reply(sock, m, `*FITUR SETACC*\n\n.setacc 5 → kalo 5 orang antri langsung ACC\n.setacc on → nyalain auto\n.setacc off → matiin auto\n.acc → ACC manual semua\n.acc cek → cek antrian\n\nStatus:\nLimit: ${settings.accLimit || 5}\nAuto: ${settings.accAuto ? 'ON 🟢' : 'OFF 🔴'}`);
  }

  settings.accLimit = num;
  if (settings.accAuto === undefined) settings.accAuto = true;
  saveGroupSettings(sessionDir, jid, settings);
  return reply(sock, m, `✅ Diatur! Nanti kalo udah ${num} orang minta join, langsung ke-ACC otomatis.\nGunakan *.acc on* buat nyalain.`);
}