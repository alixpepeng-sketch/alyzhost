import axios from 'axios';
import { reply } from '../utils.js';

const API_URL = 'https://anita-studio.netlify.app/.netlify/functions/amprem';

async function post(action, data) {
  const res = await axios.post(API_URL, { action,...data }, {
    headers: { 'Content-Type': 'application/json' }
  });
  return res.data;
}

export default async function amverif(sock, m, args) {
  const raw = args.raw || ''; // ini penting, biar link panjang gak kepotong spasi
  const [email, rawLink] = raw.split('|').map(s => s.trim());

  if (!email ||!rawLink) {
    return reply(sock, m, 'Format:.amverif EMAIL_KAMU | RAW_MAGIC_LINK_KAMU\nContoh:.amverif test@gmail.com | https://...');
  }

  try {
    const verification = await post('verify-account', { email, rawLink });
    console.log(verification);
    if (!verification.success) throw new Error(verification.message || 'Verifikasi gagal');

    const idToken = verification.idToken || verification.profile?.idToken;
    if (!idToken) throw new Error('idToken tidak ditemukan');

    const premium = await post('apply-premium', { email, idToken });
    console.log(premium);
    if (!premium.success) throw new Error(premium.message || 'Proses gagal');

    return reply(sock, m, `Sukses premium untuk ${email}\n\n${JSON.stringify(premium, null, 2)}`);
  } catch (error) {
    if (error.response) {
      return reply(sock, m, `Status: ${error.response.status}\nData: ${JSON.stringify(error.response.data)}`);
    } else {
      return reply(sock, m, error.message);
    }
  }
}