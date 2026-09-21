import { reply } from '../utils.js'
import { downloadMediaMessage } from '@whiskeysockets/baileys'

export async function swgc(sock, m, args, sessionDir) {
  try {
    const allGroups = await sock.groupFetchAllParticipating()
    const jidList = Object.keys(allGroups)
    if (!jidList.length) return reply(sock, m, 'Bot tidak di grup')

    const q = m.quoted ? m.quoted : m
    const mime = (q.msg || q).mimetype || ''
    const teks = args.raw || m.quoted?.text || ''

    const statusJid = 'status@broadcast'
    const opt = { statusJidList: jidList }

    const getMedia = async (msg) => {
      return await downloadMediaMessage(msg, 'buffer', {}, { logger: sock.logger, reuploadRequest: sock.updateMediaMessage })
    }

    if (/image/.test(mime)) {
      const media = await getMedia(q)
      await sock.sendMessage(statusJid, { image: media, caption: teks, ...opt })
      return reply(sock, m, `✅ SWGC foto ke ${jidList.length} grup`)
    } 
    if (/video/.test(mime)) {
      const media = await getMedia(q)
      await sock.sendMessage(statusJid, { video: media, caption: teks, ...opt })
      return reply(sock, m, `✅ SWGC video ke ${jidList.length} grup`)
    }
    
    if (!teks) return reply(sock, m, 'Ketik .swgc teks / reply foto/video')
    await sock.sendMessage(statusJid, { text: teks, backgroundColor: '#075E54', font: 0, ...opt })
    return reply(sock, m, `✅ SWGC teks ke ${jidList.length} grup`)

  } catch (e) {
    console.log(e)
    return reply(sock, m, 'Gagal: ' + e.message)
  }
}

export const upswgc = swgc
