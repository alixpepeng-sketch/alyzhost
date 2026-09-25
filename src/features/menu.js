export default async function menu(sock, m) {
  const text = `╭─── XALYZ BOT ───╮
│
│  自分を過大評価しては
│  いけません。高い山でさえ
│  傲慢ではないことを覚えて
│  おいてください。なぜなら、
│  その山よりもさらに高い
│  空が存在するからです。
│  @AlyzBotWa
│
│  Total: 35 Fitur
│
│ ◦ GROUP
│ • .tagall
│ • .accallmem
│ • .setacc <jumlah>
│ • .acc on/off
│ • .acc / .acc cek
│ • .kickall
│ • .open
│ • .close
│ • .setnamegroup
│ • .setdesk
│ • .revoke
│ • .swgc
│ • .jpmv1
│ • .asahotak
│ • .antios on/off
│
│ ◦ SETTINGS
│ • .antilink
│ • .adminonly
│ • .setwelcome
│ • .setleave
│ • .welcome
│ • .leave
│
│ ◦ TOOLS
│ • .ai
│ • .sticker
│ • .toimg
│ • .tomp3
│ • .tiktok
│ • .removebg
│ • .brat
│ • .bratvd
│ • .getpp
│ • .rvo
│ • .toptv
│ • .fotolive
│ • .balikinjf
│ • .play
│ • .playdl
│
│ ◦ OWNER
│ • .selfmode
│ • .amsend
│ • .amverif
╰───────────────╯`;

  await sock.sendMessage(m.key.remoteJid, {
    image: { url: 'https://files.catbox.moe/1849ng.jpg' },
    caption: "```" + text + "```"
  }, { quoted: m });
}
