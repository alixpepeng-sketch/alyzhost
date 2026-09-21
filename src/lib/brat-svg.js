// Membuat SVG sticker brat: latar putih, teks hitam tebal San Francisco,
// emoji gaya iPhone (Twemoji), watermark "ALYZ BOT" di bawah.
// Fungsi murni tanpa dependency tambahan supaya mudah dites.

const CANVAS = 512;
const PADDING = 28;
const WATERMARK_SPACE = 46;
const CHAR_WIDTH = 0.62; // perkiraan lebar rata-rata karakter bold sans dalam em
const LINE_HEIGHT = 1.12;

// Font San Francisco (fallback berlapis agar tetap mirip di semua OS/server)
const FONT_FAMILY =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'San Francisco', 'Helvetica Neue', 'Inter', Arial, sans-serif";

// CDN Twemoji untuk emoji bergaya iPhone (colorful, rounded)
const TWEMOJI_CDN =
  'https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.0.3/assets/svg';

export function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Deteksi apakah sebuah karakter adalah emoji.
function isEmoji(ch) {
  const cp = ch.codePointAt(0);
  return (
    (cp >= 0x1F300 && cp <= 0x1FAFF) || // simbol & pictographs utama
    (cp >= 0x2600 && cp <= 0x27BF) ||   // simbol misc & dingbats
    (cp >= 0x1F000 && cp <= 0x1F2FF) || // mahjong, domino, dll
    (cp >= 0x2190 && cp <= 0x21FF) ||   // panah
    (cp >= 0x2B00 && cp <= 0x2BFF) ||   // simbol tambahan
    cp === 0x2764 || // hati
    cp === 0x2B50 || // bintang
    cp === 0x2705 || // centang hijau
    cp === 0x274C    // silang merah
  );
}

// Pecah teks menjadi token: { type: 'text' | 'emoji', value }
function tokenize(text) {
  const tokens = [];
  for (const ch of Array.from(text)) {
    if (isEmoji(ch)) {
      tokens.push({ type: 'emoji', value: ch });
    } else {
      const last = tokens[tokens.length - 1];
      if (last && last.type === 'text') last.value += ch;
      else tokens.push({ type: 'text', value: ch });
    }
  }
  return tokens;
}

// Konversi karakter emoji ke kode codepoint untuk URL Twemoji.
function emojiToCodePoint(emoji) {
  const codes = [];
  for (const ch of emoji) {
    const cp = ch.codePointAt(0).toString(16);
    if (cp !== 'fe0f') codes.push(cp);
  }
  return codes.join('-');
}

// Bungkus kata menjadi beberapa baris berdasarkan maxChars.
function wrapWords(words, maxChars) {
  const lines = [];
  let line = '';
  for (let word of words) {
    while (word.length > maxChars) {
      if (line) {
        lines.push(line);
        line = '';
      }
      lines.push(word.slice(0, maxChars));
      word = word.slice(maxChars);
    }
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length <= maxChars) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Hitung layout: cari ukuran font terbesar yang muat.
export function layoutBrat(text) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const longest = Math.max(1, ...words.map((w) => w.length));
  const availW = CANVAS - PADDING * 2;
  const availH = CANVAS - PADDING - WATERMARK_SPACE;

  let last = null;
  for (const keepWords of [true, false]) {
    for (let size = 150; size >= 18; size -= 2) {
      const maxChars = Math.max(1, Math.floor(availW / (size * CHAR_WIDTH)));
      if (keepWords && maxChars < longest) continue;
      const lines = wrapWords(words, maxChars);
      last = { size, lineHeight: size * LINE_HEIGHT, lines };
      if (lines.length * size * LINE_HEIGHT <= availH) return last;
    }
  }
  return last;
}

// Hitung lebar sebuah token dalam satuan piksel.
function measureToken(tok, size) {
  if (tok.type === 'emoji') return size * 1.05;
  return tok.value.length * size * CHAR_WIDTH;
}

// Render satu baris menjadi tspan (teks) + image (emoji).
// Semua di-center secara horizontal di dalam kanvas.
function renderLine(tokens, y, size, baselineOffset) {
  let totalWidth = 0;
  for (const tok of tokens) totalWidth += measureToken(tok, size);

  let x = (CANVAS - totalWidth) / 2;
  let tspans = '';
  let emojiImages = '';

  for (const tok of tokens) {
    const w = measureToken(tok, size);
    if (tok.type === 'emoji') {
      const emojiSize = size * 0.95;
      const emojiY = y - baselineOffset * 0.78;
      const code = emojiToCodePoint(tok.value);
      emojiImages +=
        `<image href="${TWEMOJI_CDN}/${code}.svg" x="${x.toFixed(2)}" y="${emojiY.toFixed(2)}" ` +
        `width="${emojiSize.toFixed(2)}" height="${emojiSize.toFixed(2)}" />`;
    } else {
      tspans += `<tspan x="${x.toFixed(2)}" y="${y.toFixed(2)}">${escapeXml(tok.value)}</tspan>`;
    }
    x += w;
  }

  return { tspans, emojiImages };
}

/**
 * Bangun SVG sticker brat.
 * @param {string} text
 * @returns {string}
 */
export function buildBratSvg(text) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  const { size, lineHeight } = layoutBrat(clean);

  // Bagi teks menjadi baris token (bukan string) supaya emoji tetap satu unit.
  const maxChars = Math.max(1, Math.floor((CANVAS - PADDING * 2) / (size * CHAR_WIDTH)));
  const tokens = tokenize(clean);

  // Bungkus token ke baris berdasarkan maxChars
  const lines = [];
  let curLine = [];
  let curLen = 0;
  for (const tok of tokens) {
    const len = tok.value.length;
    if (curLen + len > maxChars && curLine.length) {
      lines.push(curLine);
      curLine = [];
      curLen = 0;
    }
    curLine.push(tok);
    curLen += len;
  }
  if (curLine.length) lines.push(curLine);

  // Hitung total tinggi untuk centering vertikal
  const totalH = lines.length * lineHeight;
  const availH = CANVAS - PADDING - WATERMARK_SPACE;
  const startY = PADDING + (availH - totalH) / 2 + size * 0.86;

  let tspansAll = '';
  let emojiAll = '';

  lines.forEach((line, i) => {
    const y = startY + i * lineHeight;
    const { tspans, emojiImages } = renderLine(line, y, size, size);
    tspansAll += tspans;
    emojiAll += emojiImages;
  });

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
      `width="${CANVAS}" height="${CANVAS}" viewBox="0 0 ${CANVAS} ${CANVAS}">`,
    `<rect width="${CANVAS}" height="${CANVAS}" fill="#ffffff"/>`,
    `<g font-family="${FONT_FAMILY}" font-weight="700" fill="#000000">${tspansAll}</g>`,
    emojiAll,
    `<text x="${CANVAS / 2}" y="${CANVAS - 20}" ` +
      `font-family="${FONT_FAMILY}" font-size="16" font-weight="700" ` +
      `fill="#000000" fill-opacity="0.55" text-anchor="middle" ` +
      `letter-spacing="3">ALYZ BOT</text>`,
    '</svg>',
  ].join('');
          }
