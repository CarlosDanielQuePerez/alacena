// Genera los íconos PNG de la app sin dependencias (mismo dibujo que icons/icon.svg).
// Uso: node scripts/make-icons.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

// Figuras en un lienzo de 512 (se dibujan en orden)
const shapes = [
  { t: 'rect', x: 0, y: 0, w: 512, h: 512, r: 112, c: '#d9774b', bg: true },
  { t: 'circle', cx: 256, cy: 268, r: 190, c: '#e48a5f' },
  { t: 'rect', x: 156, y: 118, w: 200, h: 66, r: 22, c: '#7a4a33' },
  { t: 'rect', x: 136, y: 170, w: 240, h: 246, r: 58, c: '#fff6e9' },
  { t: 'rect', x: 176, y: 250, w: 160, h: 88, r: 24, c: '#8fa98a' },
  { t: 'circle', cx: 226, cy: 294, r: 14, c: '#fff6e9' },
  { t: 'circle', cx: 286, cy: 294, r: 14, c: '#fff6e9' },
];

function inside(s, x, y, square) {
  if (s.t === 'circle') return (x - s.cx) ** 2 + (y - s.cy) ** 2 <= s.r ** 2;
  const r = s.bg && square ? 0 : s.r;
  const qx = Math.abs(x - (s.x + s.w / 2)) - (s.w / 2 - r);
  const qy = Math.abs(y - (s.y + s.h / 2)) - (s.h / 2 - r);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r <= 0;
}

function draw(size, square) {
  const px = Buffer.alloc(size * size * 4);
  const ss = 4;
  const k = 512 / size;
  const cols = shapes.map((s) => hex(s.c));
  for (let py = 0; py < size; py++) {
    for (let pxx = 0; pxx < size; pxx++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const x = (pxx + (sx + 0.5) / ss) * k;
          const y = (py + (sy + 0.5) / ss) * k;
          let col = null;
          for (let i = 0; i < shapes.length; i++) if (inside(shapes[i], x, y, square)) col = cols[i];
          if (col) { r += col[0]; g += col[1]; b += col[2]; a++; }
        }
      }
      const o = (py * size + pxx) * 4;
      if (a) { px[o] = r / a; px[o + 1] = g / a; px[o + 2] = b / a; }
      px[o + 3] = Math.round((a / (ss * ss)) * 255);
    }
  }
  return px;
}

const CRC = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, square) {
  const px = draw(size, square);
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const out = new URL('../icons/', import.meta.url);
mkdirSync(out, { recursive: true });
const files = [
  ['icon-192.png', 192, false],
  ['icon-512.png', 512, false],
  ['icon-maskable-512.png', 512, true],
  ['icon-180.png', 180, true], // apple-touch-icon: iOS redondea las esquinas
];
for (const [name, size, square] of files) {
  writeFileSync(new URL(name, out), png(size, square));
  console.log('✓', name);
}
