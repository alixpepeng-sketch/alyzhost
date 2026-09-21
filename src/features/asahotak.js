import path from 'node:path';
import fs from 'node:fs';

const SOAL = [
  { q: "Ibukota Indonesia?", a: "jakarta" },
  { q: "2 + 2 x 5 =?", a: "12" },
  { q: "Hewan yang disebut Raja Hutan?", a: "singa" },
  { q: "Planet terdekat dengan matahari?", a: "merkurius" },
  { q: "Warna bendera Indonesia?", a: "merah putih" },
  { q: "Berapa kaki laba-laba?", a: "8" },
  { q: "Gunung tertinggi di Indonesia?", a: "jayawijaya" },
  { q: "Alat untuk mengukur suhu?", a: "termometer" },
  { q: "Lambang kimia air?", a: "h2o" },
  { q: "Siapa penemu lampu?", a: "thomas alva edison" },
  { q: "Benua terbesar di dunia?", a: "asia" },
  { q: "Ibukota Jepang?", a: "tokyo" },
  { q: "Berapa detik dalam 1 menit?", a: "60" },
  { q: "Binatang yang bisa hidup di air dan darat?", a: "amfibi" },
  { q: "Bahasa pemrograman bot ini?", a: "javascript" },
  { q: "5 x 5 + 5 =?", a: "30" },
  { q: "Ibukota Jawa Tengah?", a: "semarang" },
  { q: "Hewan tercepat di darat?", a: "cheetah" },
  { q: "Jumlah provinsi di Indonesia sekarang?", a: "38" },
  { q: "Warna campuran merah + biru?", a: "ungu" },
  { q: "Siapa bapak proklamator?", a: "soekarno" },
  { q: "Lagu Indonesia Raya diciptakan oleh?", a: "w r supratman" },
  { q: "Kota yang disebut kota pelajar?", a: "yogyakarta" },
  { q: "Planet bercincin?", a: "saturnus" },
  { q: "Mata uang Jepang?", a: "yen" },
  { q: "10 + 10 x 0 =?", a: "10" },
  { q: "Hewan yang tidur terbalik?", a: "kelelawar" },
  { q: "Ibukota Australia?", a: "canberra" },
  { q: "Berapa sisi segitiga?", a: "3" },
  { q: "Nama samaran Nobita?", a: "doraemon" },
  { q: "Sungai terpanjang di dunia?", a: "nil" },
  { q: "Buah dengan duri luar?", a: "durian" },
  { q: "1 kg sama dengan berapa gram?", a: "1000" },
  { q: "Warna darah?", a: "merah" },
  { q: "Hewan pemakan daging disebut?", a: "karnivora" },
  { q: "Ibukota Inggris?", a: "london" },
  { q: "100 - 1 =?", a: "99" },
  { q: "Siapa yang menciptakan Facebook?", a: "mark zuckerberg" },
  { q: "Bendera Jepang warnanya?", a: "putih merah" },
  { q: "Gunung berapi di Italia?", a: "vesuvius" },
  { q: "Hewan laut terbesar?", a: "paus biru" },
  { q: "Bahasa resmi Brazil?", a: "portugis" },
  { q: "3 x 12 =?", a: "36" },
  { q: "Ibukota Korea Selatan?", a: "seoul" },
  { q: "Hewan yang punya punuk?", a: "unta" },
  { q: "Benda langit yang bersinar di malam hari?", a: "bintang" },
  { q: "Siapa itu alyz?", a: "owner ganteng" },
  { q: "Pulau terbesar di Indonesia?", a: "kalimantan" },
  { q: "Air membeku di suhu berapa?", a: "0 derajat" },
  { q: "Jumlah pemain sepak bola?", a: "11" },
];

let game = {}; // { groupId: { soal, jawaban, juara: [] } }

export default async function asahotak(sock, m, args, sessionDir) {
  const id = m.key.remoteJid;
  if (game[id]) return sock.sendMessage(id, { text: `❌ Masih ada soal aktif:\n${game[id].soal}\n\nJawab dulu!` }, { quoted: m });

  const rnd = SOAL[Math.floor(Math.random() * SOAL.length)];
  game[id] = { soal: rnd.q, jawaban: rnd.a.toLowerCase(), juara: [] };

  await sock.sendMessage(id, {
    text: `🧠 *ASAH OTAK - ALYZ BOT*\n\nSoal: ${rnd.q}\n\nKetik jawaban langsung tanpa titik!\nJuara 1-3 bakal dicatat.`
  });

  setTimeout(async () => {
    if (game[id]) {
      await sock.sendMessage(id, { text: `⏰ Waktu habis!\nJawaban: *${game[id].jawaban}*\nTidak ada yang menjawab 😭` });
      delete game[id];
    }
  }, 30000);
}

export async function cekJawaban(sock, m, text, sessionDir) {
  const id = m.key.remoteJid;
  if (!game[id]) return;
  if (m.key.fromMe) return;

  if (text.toLowerCase().trim() === game[id].jawaban) {
    const sender = m.key.participant || m.key.remoteJid;
    const nama = m.pushName || sender.split('@')[0];
    game[id].juara.push({ nama, jid: sender });

    if (game[id].juara.length === 1) {
      await sock.sendMessage(id, { text: `✅ *BENAR!*\n🥇 Juara 1: ${nama}\n\nLanjut cari Juara 2 & 3...` });
    } else if (game[id].juara.length === 2) {
      await sock.sendMessage(id, { text: `✅ *BENAR!*\n🥈 Juara 2: ${nama}\n\nSisa 1 slot lagi!` });
    } else if (game[id].juara.length >= 3) {
      const j = game[id].juara;
      const hasil = `🏆 *GAME SELESAI - ASAH OTAK* 🏆\n\nSoal: ${game[id].soal}\nJawaban: *${game[id].jawaban}*\n\n🥇 Juara 1: ${j[0].nama}\n🥈 Juara 2: ${j[1].nama}\n🥉 Juara 3: ${j[2].nama}\n\nGG semua!`;
      await sock.sendMessage(id, { text: hasil });
      delete game[id];
    }
  }
}