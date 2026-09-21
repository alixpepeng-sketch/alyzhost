import { sleep } from '../utils.js';
import yts from 'yt-search';
import ytdl from '@distube/ytdl-core';
import fs from 'fs';

const SONG = 'Justfrend Kok Jatuh Suka Raim Laode';

export default async function balikinjf(sock, m) {
  const chat = m.key.remoteJid;

  try {
    await sock.sendMessage(chat, {
      text: `Lah masih berharap sama justfrend? cuma justfrend kok jatuh cinta`
    }, { quoted: m });

    await sleep(1000);

    const search = await yts(SONG);
    const video = search.videos[0];

    const fileName = `./jf_${Date.now()}.mp3`;
    const stream = ytdl(video.url, { filter: 'audioonly', quality: 'highestaudio' });
    const write = fs.createWriteStream(fileName);
    stream.pipe(write);
    await new Promise(res => write.on('finish', res));

    await sock.sendMessage(chat, {
      audio: fs.readFileSync(fileName),
      mimetype: 'audio/mpeg',
      fileName: `${SONG}.mp3`
    }, { quoted: m });

    fs.unlinkSync(fileName);

  } catch (e) {
    await sock.sendMessage(chat, { text: `Gagal: ${e.message}` }, { quoted: m });
  }
                                       }
