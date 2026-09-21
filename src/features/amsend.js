import axios from 'axios';
import { reply } from '../utils.js';

const API_URL = 'https://anita-studio.netlify.app/.netlify/functions/amprem';

async function post(action, data) {
  const res = await axios.post(API_URL, { action,...data }, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000
  });
  return res.data;
}

export default async function amsend(sock, m, args) {
  const email = (args[0] || '').trim();
  if (!email) return reply(sock, m, 'Contoh:.amsend EMAIL_KAMU');

  try {
    const magicLink = await post('send-magiclink', { email });
    console.log(magicLink);
    if (!magicLink.success) {
      return reply(sock, m, `Gagal: ${magicLink.message || 'Gagal mengirim magic link'}`);
    }
    return reply(sock, m, `Magic link terkirim ke ${email}\n\nHabis itu kirim:.amverif ${email} | RAW_MAGIC_LINK_KAMU`);
  } catch (err) {
    if (err.response) return reply(sock, m, `Status: ${err.response.status}\nData: ${JSON.stringify(err.response.data)}`);
    return reply(sock, m, err.message);
  }
}