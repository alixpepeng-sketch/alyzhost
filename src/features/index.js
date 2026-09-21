import ai from './ai.js';
import balikinjf from './balikinjf.js';
import brat from './brat.js';
import fotolive from './fotolive.js';
import getpp from './getpp.js';
import { close, open, revoke, setdesk, setnamegroup } from './groupadmin.js';
import { adminonly, antilink } from './groupsettings.js';
import kickall from './kickall.js';
import menu from './menu.js';
import removebg from './removebg.js';
import rvo from './rvo.js';
import selfmode, { publicMode, self } from './selfmode.js';
import sticker from './sticker.js';
import tagall from './tagall.js';
import tiktok from './tiktok.js';
import toimg from './toimg.js';
import tomp3 from './tomp3.js';
import toptv from './toptv.js';
import { leave, setleave, setwelcome, welcome } from './welcome.js';
import amsend from './amsend.js';
import amverif from './amverif.js';

// Kunci = nama perintah huruf kecil tanpa titik. Semua fitur menerima
// (sock, m, args, sessionDir).
export const commands = {
  menu,
  rvo,
  toptv,
  fotolive,
  kickall,
  selfmode,
  self,
  public: publicMode,
  removebg,
  sticker,
  s: sticker,
  brat,
  setwelcome,
  setleave,
  welcome,
  leave,
  ai,
  getpp,
  tiktok,
  tomp3,
  tagall,
  toimg,
  setnamegroup,
  setdesk,
  open,
  close,
  revoke,
  antilink,
  adminonly,
  balikinjf,
  amsend,
  amverif,
};