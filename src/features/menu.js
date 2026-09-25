export default async function menu(sock, m) {
  const text = `╭─── XALYZ BOT ───╮
│ 自分を過大評価してはいけません。高い山でさえ傲慢ではないことを覚えておいてください。なぜなら、その山よりもさらに高い空が存在するからです。@AlyzBotWa
│
│ Total: 35 Fitur
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
