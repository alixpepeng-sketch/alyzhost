export default async function menu(sock, m) {
  const text = `╭─── ALYZ BOT ───╮
│ Total: 33 Fitur
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
│ • .getpp
│ • .rvo
│ • .toptv
│ • .fotolive
│ • .balikinjf
│ • .play
│
│ ◦ OWNER
│ • .selfmode
│ • .amsend
│ • .amverif
╰───────────────╯`;

  await sock.sendMessage(m.key.remoteJid, {
    image: { url: 'https://files.catbox.moe/c4rt8u.jpeg' },
    caption: "```" + text + "```"
  }, { quoted: m });
}
