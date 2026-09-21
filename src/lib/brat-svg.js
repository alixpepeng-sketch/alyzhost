const CANVAS = 512;
const PADDING = 24;
const CHAR_WIDTH = 0.58;
const LINE_HEIGHT = 0.95;
const FONT_FAMILY = "'Arial Black', Arial, Helvetica, sans-serif";

export function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapWords(words, maxChars) {
  const lines = [];
  let line = '';
  for (let word of words) {
    while (word.length > maxChars) {
      if (line) { lines.push(line); line = ''; }
      lines.push(word.slice(0, maxChars));
      word = word.slice(maxChars);
    }
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length <= maxChars) line = candidate;
    else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines;
}

export function layoutBrat(text) {
  const words = String(text).toLowerCase().split(/\s+/).filter(Boolean);
  const longest = Math.max(1, ...words.map((w) => w.length));
  const availW = CANVAS - PADDING * 2;
  const availH = CANVAS - PADDING * 2;
  let last = null;
  for (const keepWords of [true, false]) {
    for (let size = 160; size >= 28; size -= 2) {
      const maxChars = Math.max(1, Math.floor(availW / (size * CHAR_WIDTH)));
      if (keepWords && maxChars < longest) continue;
      const lines = wrapWords(words, maxChars);
      last = { size, lineHeight: size * LINE_HEIGHT, lines };
      if (lines.length * size * LINE_HEIGHT <= availH) return last;
    }
  }
  return last;
}

export function buildBratSvg(text) {
  const { size, lineHeight, lines } = layoutBrat(text);
  const totalH = lines.length * lineHeight;
  const firstBaseline = (CANVAS - totalH) / 2 + size * 0.82;
  const rows = lines.map((line, i) => {
    const y = (firstBaseline + i * lineHeight).toFixed(1);
    return `<text x="${CANVAS/2}" y="${y}" font-size="${size}" text-anchor="middle">${escapeXml(line)}</text>`;
  }).join('');
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS}" height="${CANVAS}" viewBox="0 0 ${CANVAS} ${CANVAS}">`,
    `<rect width="${CANVAS}" height="${CANVAS}" fill="#ffffff"/>`,
    `<g font-family="${FONT_FAMILY}" font-weight="900" fill="#000000" letter-spacing="-2px">${rows}</g>`,
    `</svg>`,
  ].join('');
    }
