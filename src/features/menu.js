export default async function menu(sock, m) {
  const text = `╭─── ALYZ BOT ───╮
│ Total: 28 Fitur
│
│ ◦ GROUP
│ • .tagall
│ • .accallmem
│ • .kickall
│ • .open
│ • .close
│ • .setnamegroup
│ • .setdesk
│ • .revoke
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
│ • .asahotak
│
│ ◦ OWNER
│ • .selfmode
│ • .amsend
│ • .amverif
╰───────────────╯`;

  const fotoRandom = [
    'https://files.catbox.moe/9nl9uk.jpg',
    'https://files.catbox.moe/d3ogpu.webp',
    'https://files.catbox.moe/pn21d8.jpg',
    'https://files.catbox.moe/8ugm4j.jpg',
    'https://files.catbox.moe/bbd849.jpg'
  ];

  const pick = fotoRandom[Math.floor(Math.random() * fotoRandom.length)];

  await sock.sendMessage(m.key.remoteJid, {
    image: { url: pick },
    caption: "```" + text + "```"
  }, { quoted: m });
                                     }
