export default async (sock, m, args, reply, isOwner, prefix) => {
  if (!isOwner) return reply('Owner only')
  try {
    const allGroups = await sock.groupFetchAllParticipating()
    const jidList = Object.keys(allGroups)
    if (!jidList.length) return reply('Bot tidak di grup')
    const q = m.quoted ? m.quoted : m
    const mime = (q.msg || q).mimetype || ''
    const teks = args.join(' ') || ''
    const statusJid = 'status@broadcast'
    const opt = { statusJidList: jidList }
    if (/image/.test(mime)) {
      const media = await q.download()
      await sock.sendMessage(statusJid, { image: media, caption: teks, ...opt })
      return reply(`SWGC foto ke ${jidList.length} grup`)
    } else if (/video/.test(mime)) {
      const media = await q.download()
      await sock.sendMessage(statusJid, { video: media, caption: teks, ...opt })
      return reply(`SWGC video ke ${jidList.length} grup`)
    } else {
      if (!teks) return reply(`${prefix}swgc teks/foto/video`)
      await sock.sendMessage(statusJid, { text: teks, backgroundColor: '#075E54', ...opt })
      return reply(`SWGC teks ke ${jidList.length} grup`)
    }
  } catch (e) {
    reply('Gagal: ' + e.message)
  }
                                         }
