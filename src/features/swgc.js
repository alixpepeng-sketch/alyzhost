case 'swgc':
case 'upswgc': {
  if (!isOwner) return reply('owner only')
  
  // ambil semua grup yang bot join
  let groups = await sock.groupFetchAllParticipating()
  let jidList = Object.keys(groups)
  if (jidList.length < 1) return reply('bot gak join grup mana pun')

  let q = m.quoted ? m.quoted : m
  let mime = (q.msg || q).mimetype || ''
  let teks = args.join(' ') || q.text || ''

  // cek kalo user kirim langsung foto/video tanpa reply
  if (!teks && !mime) return reply(
    `*Cara pakai ${prefix}swgc:*\n\n`+
    `1. Teks: ${prefix}swgc halo anak grup\n`+
    `2. Foto: kirim/reply foto dengan caption ${prefix}swgc promo gacor\n`+
    `3. Video: kirim/reply video dengan caption ${prefix}swgc cek ini`
  )

  await reply(`⏳ Upload SWGC ke ${jidList.length} grup...`)

  try {
    let status = 'status@broadcast'
    let opt = { statusJidList: jidList }

    if (/image/.test(mime)) {
      // FOTO
      let media = await q.download()
      await sock.sendMessage(status, { image: media, caption: teks, ...opt })
      reply(`✅ SWGC Foto sukses ke ${jidList.length} grup`)

    } else if (/video/.test(mime)) {
      // VIDEO
      let media = await q.download()
      await sock.sendMessage(status, { video: media, caption: teks, mimetype: 'video/mp4', ...opt })
      reply(`✅ SWGC Video sukses ke ${jidList.length} grup`)

    } else {
      // TEKS ONLY
      await sock.sendMessage(status, { 
        text: teks, 
        backgroundColor: '#' + Math.floor(Math.random()*16777215).toString(16),
        font: Math.floor(Math.random()*5),
        ...opt 
      })
      reply(`✅ SWGC Teks sukses ke ${jidList.length} grup`)
    }

  } catch (e) {
    console.log(e)
    reply('❌ Gagal up swgc')
  }
  break
    }
