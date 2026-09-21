export default async function swgc(sock, m, args) {
  const id = m.key.remoteJid;
  if (!id.endsWith('@g.us')) return sock.sendMessage(id, { text: `❌ Fitur .swgc cuma bisa di group` }, { quoted: m });

  const text = args.join(' ').trim();
  const q = m.quoted ? m.quoted : m;
  const mime = (q.msg || q).mimetype || '';
  const isMedia = /image|video/.test(mime);

  try {
    // 1. KALO ADA FOTO
    if (/image/.test(mime)) {
      const media = await q.download();
      await sock.sendMessage(id, {
        image: media,
        caption: text || q.text || ''
      });
    } 
    // 2. KALO ADA VIDEO
    else if (/video/.test(mime)) {
      const media = await q.download();
      await sock.sendMessage(id, {
        video: media,
        caption: text || q.text || '',
        mimetype: 'video/mp4'
      });
    } 
    // 3. KALO CUMA TEKS
    else {
      if (!text) return sock.sendMessage(id, { text: `Contoh:\n.swgc teksnya\n.swgc (reply foto)\n.swgc (reply video) + caption` }, { quoted: m });
      
      await sock.sendMessage(id, {
        text: text,
        backgroundColor: "#0a0a0a",
        font: Math.floor(Math.random() * 6), // font random biar keren kayak SW
      });
    }

    await sock.sendMessage(id, { react: { text: "✅", key: m.key } });

  } catch (err) {
    console.log("[SWGC ERROR]", err);
    await sock.sendMessage(id, { text: `Gagal up SWGC: ${err.message}` }, { quoted: m });
  }
}