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
│
│ 自分を過大評価しては
│ いけません。高い山で
│ さえ傲慢ではないこと
│ を覚えておいて下さい
│ なぜなら、その山より
│ もさらに高い空が
│ 存在するからです。
│ @AlyzBotWa
│
│ Owner : Alyz
│ User : ${m.pushName || 'User'}
│ Status : ${botStatus}
│
│ Total: 35 Fitur
│
│ ◦ GROUP
│ •.tagall
│ •.accallmem
│ •.setacc <jumlah>
│ •.acc on/off
│ •.acc cek
│ •.kickall
│ •.open
│ •.close
│ •.setnamegroup
│ •.setdesk
│ •.revoke
│ •.swgc
│ •.jpmv1
│ •.asahotak
│ •.antios on/off
│
│ ◦ SETTINGS
│ •.antilink
│ •.adminonly
│ •.setwelcome
│ •.setleave
│ •.welcome
│ •.leave
│
│ ◦ TOOLS
│ •.ai
│ •.sticker
│ •.toimg
│ •.tomp3
│ •.tiktok
│ •.removebg
│ •.brat
│ •.bratvd
│ •.getpp
│ •.rvo
│ •.toptv
│ •.fotolive
│ •.balikinjf
│ •.play
│ •.playdl
│
│ ◦ OWNER
│ •.selfmode
│ •.amsend
│ •.amverif
╰───────────────╯`;

  await sock.sendMessage(m.key.remoteJid, {
    image: { url: 'https://files.catbox.moe/1849ng.jpg' },
    caption: "\`\`\`" + text + "\`\`\`"
  }, { quoted: m });
}
