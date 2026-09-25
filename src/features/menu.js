export default async function menu(sock, m) {
  const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
  let botStatus = 'Member';
  try {
    if (m.key.remoteJid.endsWith('@g.us')) {
      const meta = await sock.groupMetadata(m.key.remoteJid);
      const bot = meta.participants.find(p => p.id === botNumber);
      if (bot?.admin) botStatus = 'Admin';
    }
  } catch {}

  const text = `╭─── XALYZ BOT ───╮

 自分を過大評価しては
 いけません。
 高い山でさえ傲慢では
 ないことを覚えて。
 その山より高い空が
 あるからです。
 @AlyzBotWa

│ Owner : Alyz
│ User : ${m.pushName || 'User'}
│ Status : ${botStatus}
│ Total : 35 Fitur
│
│ ◦ GROUP
│ •.tagall
│ •.accallmem
│ •.setacc <jumlah>
│ •.acc on/off
│ •.acc cek
│ •.kickall
│ •.open /.close
│ •.setnamegroup
│ •.setdesk
│ •.revoke
│
│ ◦ SETTINGS
│ •.antilink
│ •.adminonly
│ •.setwelcome
│ •.welcome
│
│ ◦ TOOLS
│ •.ai.sticker.toimg
│ •.tiktok.brat.bratvd
│ •.play.playdl.rvo
│
│ ◦ OWNER
│ •.selfmode.amsend
╰─────────────────╯`;

  await sock.sendMessage(m.key.remoteJid, {
    image: { url: 'https://files.catbox.moe/1849ng.jpg' },
    caption: text
  }, { quoted: m });
    }
