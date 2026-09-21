import fs from 'fs';
import path from 'path';

export default async function balikinjf(sock, m) {
  const chat = m.key.remoteJid;
  const audioPath = path.resolve('./media/jf.mp3');

  try {
    // 1. text prank nya
    await sock.sendMessage(chat, { 
      text: 'Loh masih berharap sama justfrend, justfrend kok jatuh cinta 😹' 
    }, { quoted: m });

    // 2. delay 1 detik
    await new Promise(r => setTimeout(r, 1000));

    // 3. kirim audio jf
    await sock.sendMessage(chat, {
      audio: fs.readFileSync(audioPath),
      mimetype: 'audio/mpeg',
      ptt: false
    }, { quoted: m });

  } catch (e) {
    // kalo mp3 belum ada, minimal text nya tetep kekirim
    await sock.sendMessage(chat, { 
      text: `Loh masih berharap sama justfrend, justfrend kok jatuh cinta 😹\n\n(mp3 belum ada di media/jf.mp3)` 
    }, { quoted: m });
  }
      }
