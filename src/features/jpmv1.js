export default async function jpmv1(sock, m, args) {
  const text = args.join(' ').trim();
  const q = m.quoted ? m.quoted : m;
  const mime = (q.msg || q).mimetype || '';
  
  const allGroups = await sock.groupFetchAllParticipating();
  const groups = Object.keys(allGroups);
  
  if (!text && !/image|video/.test(mime)) {
    return sock.sendMessage(m.key.remoteJid, { 
      text: `Contoh penggunaan:\n.jpmv1 Halo semua group!\n.jpmv1 (reply foto)\n.jpmv1 Ready stok (reply video)` 
    }, { quoted: m });
  }

  await sock.sendMessage(m.key.remoteJid, { text: `🚀 JPM V1 ke ${groups.length} group...\nTipe: ${/image/.test(mime) ? 'FOTO' : /video/.test(mime) ? 'VIDEO' : 'TEKS'}` }, { quoted: m });

  let mediaBuffer = null;
  if (/image|video/.test(mime)) {
    mediaBuffer = await q.download();
  }

  let sukses = 0;
  for (let id of groups) {
    try {
      if (/image/.test(mime)) {
        await sock.sendMessage(id, { image: mediaBuffer, caption: text || q.text || '' });
      } else if (/video/.test(mime)) {
        await sock.sendMessage(id, { video: mediaBuffer, caption: text || q.text || '', mimetype: 'video/mp4' });
      } else {
        await sock.sendMessage(id, { text: text });
      }
      sukses++;
      await new Promise(r => setTimeout(r, 1200)); // delay 1.2 detik biar gak ke ban
    } catch {}
  }

  await sock.sendMessage(m.key.remoteJid, { text: `✅ JPM V1 Done!\nBerhasil: ${sukses}/${groups.length} group` }, { quoted: m });
}