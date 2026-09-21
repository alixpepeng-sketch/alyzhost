import yts from 'yt-search';
import ytdl from '@distube/ytdl-core';
import fs from 'fs';

export default async function play(sock, m, args) {
  const chat = m.key.remoteJid;
  const query = args.join(' ');
  if (!query) return sock.sendMessage(chat, { text: `Contoh:.play justfrend kok jatuh suka` }, { quoted: m });

  try {
    await sock.sendMessage(chat, { react: { text: '🔎', key: m.key } });

    const search = await yts(query);
    const video = search.videos[0];
    if (!video) return sock.sendMessage(chat, { text: `Gak ketemu: ${query}` }, { quoted: m });

    await sock.sendMessage(chat, { text: `*Nunggu bentar...*\n\n> ${video.title}\n> ${video.url}` }, { quoted: m });

    const fileName = `./play_${Date.now()}.mp3`;
    const stream = ytdl(video.url, { filter: 'audioonly', quality: 'highestaudio' });
    const write = fs.createWriteStream(fileName);
    stream.pipe(write);
    await new Promise(res => write.on('finish', res));

    await sock.sendMessage(chat, {
      audio: fs.readFileSync(fileName),
      mimetype: 'audio/mpeg',
      fileName: `${video.title}.mp3`
    }, { quoted: m });

    fs.unlinkSync(fileName);
    await sock.sendMessage(chat, { react: { text: '✅', key: m.key } });

  } catch (e) {
    await sock.sendMessage(chat, { text: `Gagal play: ${e.message}` }, { quoted: m });
  }
}