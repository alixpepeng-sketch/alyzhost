// Membuat SVG sticker brat: latar putih, teks hitam tebal San Francisco,
// emoji gaya iPhone (Twemoji inline base64), watermark "ALYZ BOT" di bawah.

import axios from 'axios';

const CANVAS = 512;
const PADDING = 28;
const WATERMARK_SPACE = 46;
const CHAR_WIDTH = 0.62;
const LINE_HEIGHT = 1.12;

const FONT_FAMILY =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'San Francisco', 'Helvetica Neue', 'Inter', Arial, sans-serif";

const TWEMOJI_CDN =
  'https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.0.3/assets/svg';

const emojiCache = new Map();

export function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function isEmoji(ch) {
  const cp = ch.codePointAt(0);
  return (
    (cp >= 0x1f300 && cp <= 0x1faff) ||
    (cp >= 0x2600 && cp <= 0x27bf) ||
    (cp >= 0x1f000 && cp <= 0x1f2ff) ||
    (cp >= 0x2190 && cp <= 0x21ff) ||
    (cp >= 0x2b00 && cp <= 0x2bff) ||
    cp === 0x2764 ||
    cp === 0x2b50 ||
    cp === 0x2705 ||
    cp === 0x274c
  );
}

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

function emojiToCodePoint(emoji) {
  const codes = [];
  for (const ch of emoji) {
    const cp = ch.codePointAt(0).toString(16);
    if (cp !== 'fe0f') codes.push(cp);
  }
  return codes.join('-');
}

async function fetchEmojiAsDataUrl(emoji) {
  const code = emojiToCodePoint(emoji);
  if (emojiCache.has(code)) return emojiCache.get(code);

  try {
    const url = `${TWEMOJI_CDN}/${code}.svg`;
    const { data } = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 5000,
    });
    const base64 = Buffer.from(data).toString('base64');
    const dataUrl = `data:image/svg+xml;base64,${base64}`;
    emojiCache.set(code, dataUrl);
    return dataUrl;
  } catch {
    const fallback = `${TWEMOJI_CDN}/${code}.svg`;
    emojiCache.set(code, fallback);
    return fallback;
  }
}

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

function measureToken(tok, size) {
  if (tok.type === 'emoji') return size * 1.05;
  return tok.value.length * size * CHAR_WIDTH;
}

/**
 * Bangun SVG sticker brat (async karena fetch emoji).
 * @param {string} text
 * @returns {Promise<string>}
 */
export async function buildBratSvg(text) {
  const clean = String(text || '')
    .replace(/\s+/g, ' ')
    .trim();
  const { size, lineHeight } = layoutBrat(clean);

  const maxChars = Math.max(
    1,
    Math.floor((CANVAS - PADDING * 2) / (size * CHAR_WIDTH))
  );

  const tokens = tokenize(clean);
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

  const totalH = lines.length * lineHeight;
  const availH = CANVAS - PADDING - WATERMARK_SPACE;
  const startY = PADDING + (availH - totalH) / 2 + size * 0.86;

  let tspansAll = '';
  let emojiAll = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const y = startY + i * lineHeight;

    let totalWidth = 0;
    for (const tok of line) totalWidth += measureToken(tok, size);

    let x = (CANVAS - totalWidth) / 2;

    for (const tok of line) {
      const w = measureToken(tok, size);
      if (tok.type === 'emoji') {
        const emojiSize = size * 0.95;
        const emojiY = y - size * 0.78;
        const dataUrl = await fetchEmojiAsDataUrl(tok.value);
        emojiAll +=
          `<image href="${dataUrl}" x="${x.toFixed(2)}" y="${emojiY.toFixed(2)}" ` +
          `width="${emojiSize.toFixed(2)}" height="${emojiSize.toFixed(2)}" />`;
      } else {
        tspansAll += `<tspan x="${x.toFixed(2)}" y="${y.toFixed(2)}">${escapeXml(tok.value)}</tspan>`;
      }
      x += w;
    }
  }

  // Teks utama: hitam pekat (#000000) dengan fill-opacity penuh
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
      `width="${CANVAS}" height="${CANVAS}" viewBox="0 0 ${CANVAS} ${CANVAS}">`,
    `<rect width="${CANVAS}" height="${CANVAS}" fill="#ffffff"/>`,
    `<g font-family="${FONT_FAMILY}" font-weight="900" fill="#000000" fill-opacity="1">${tspansAll}</g>`,
    emojiAll,
    `<text x="${CANVAS / 2}" y="${CANVAS - 20}" ` +
      `font-family="${FONT_FAMILY}" font-size="16" font-weight="700" ` +
      `fill="#000000" fill-opacity="0.55" text-anchor="middle" ` +
      `letter-spacing="3">ALYZ BOT</text>`,
    '</svg>',
  ].join('');
        }
