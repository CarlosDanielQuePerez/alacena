// Lectura de tickets: OCR con Tesseract.js (se carga solo cuando se necesita)
// y un intérprete que convierte el texto en productos con precio.
import { normalize } from './foods.js';
import { toISO } from './utils.js';

const TESSERACT_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
let tessPromise = null;

function loadTesseract() {
  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  tessPromise ||= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = TESSERACT_URL;
    s.async = true;
    s.onload = () => resolve(window.Tesseract);
    s.onerror = () => {
      tessPromise = null;
      s.remove();
      reject(new Error('offline'));
    };
    document.head.append(s);
  });
  return tessPromise;
}

async function loadBitmap(file) {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch { /* se intenta con <img> */ }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

// Escala, pasa a escala de grises y estira el contraste para ayudar al OCR.
async function prepareImage(file) {
  const img = await loadBitmap(file);
  const w0 = img.width, h0 = img.height;
  const scale = Math.min(1, 2200 / Math.max(w0, h0), Math.max(1, 1400 / Math.min(w0, h0)));
  const w = Math.round(w0 * scale), h = Math.round(h0 * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);
  const im = ctx.getImageData(0, 0, w, h);
  const px = im.data;
  const hist = new Uint32Array(256);
  for (let i = 0; i < px.length; i += 4) {
    const g = (px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114) | 0;
    px[i] = g;
    hist[g]++;
  }
  // Percentiles 1% y 99%. Si el rango es corto (p. ej. ticket casi todo blanco),
  // no se estira para no borrar el texto.
  const total = w * h;
  let lo = 0, hi = 255, acc = 0;
  for (let i = 0; i < 256; i++) { acc += hist[i]; if (acc > total * 0.01) { lo = i; break; } }
  acc = 0;
  for (let i = 0; i < 256; i++) { acc += hist[i]; if (acc >= total * 0.99) { hi = i; break; } }
  const stretch = hi - lo >= 64;
  const range = hi - lo;
  for (let i = 0; i < px.length; i += 4) {
    const v = stretch ? Math.max(0, Math.min(255, ((px[i] - lo) * 255) / range)) : px[i];
    px[i] = px[i + 1] = px[i + 2] = v;
    px[i + 3] = 255;
  }
  ctx.putImageData(im, 0, 0);
  return canvas;
}

export async function readTicket(file, onProgress = () => {}) {
  onProgress(0.03, 'Preparando la foto…');
  const [T, image] = await Promise.all([loadTesseract(), prepareImage(file)]);
  onProgress(0.1, 'Despertando al lector…');
  const { data } = await T.recognize(image, 'spa', {
    logger: (m) => {
      if (m.status === 'recognizing text') onProgress(0.3 + m.progress * 0.7, 'Leyendo tu ticket…');
      else if (typeof m.progress === 'number') onProgress(0.1 + m.progress * 0.2, 'Despertando al lector…');
    },
  });
  return data.text || '';
}

// ---------- Interpretación del texto ----------

const STORES = [
  'bodega aurrera', 'mi bodega', 'walmart', 'soriana', 'chedraui', 'oxxo', 'costco', 'sams club', 'sam s club', 'la comer',
  'city market', 'fresko', 'superama', 'h e b', 'heb', '7 eleven', 'seven eleven', 'calimax', 'casa ley', 'alsuper',
  's mart', 'smart', 'merza', 'circle k', 'tiendas extra', 'tiendas 3b', 'neto', 'super aki', 'comercial mexicana', 'mega',
  'farmacias guadalajara', 'farmacia del ahorro', 'san pablo', 'waldos', 'sumesa', 'la europea',
];

const SKIP = new RegExp(
  '\\b(' +
    [
      'sub ?total', 'total', 'iva', 'ieps', 'impuesto', 'cambio', 'efectivo', 'tarjeta', 'pago', 'pagado', 'rfc', 'fecha', 'hora',
      'ticket', 'folio', 'caja', 'cajero', 'cajera', 'gracias', 'articulos', 'arts?', 'tienda', 'sucursal', 'tel', 'telefono', 'www',
      'factura', 'facturacion', 'vuelva', 'ahorro', 'ahorraste', 'descuento', 'desc', 'redondeo', 'saldo', 'puntos', 'visa',
      'mastercard', 'master', 'amex', 'debito', 'credito', 'autoriz\\w*', 'aprob\\w*', 'cliente', 'cp', 'regimen', 'domicilio',
      'transaccion', 'operacion', 'referencia', 'cuenta', 'monedero', 'bonificacion', 'propina', 'importe', 'vale',
    ].join('|') +
    ')\\b'
);

const PRICE_END = /\$?\s?(-?\d{1,5}(?:,\d{3})*[.,]\s?\d{2})\s*[A-Za-z*#]{0,2}\s*$/;
const MONTHS = { ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6, jul: 7, ago: 8, sep: 9, set: 9, oct: 10, nov: 11, dic: 12 };

function num(s) {
  let t = String(s).replace(/[^\d.,-]/g, '');
  if (t.includes('.') && t.includes(',')) t = t.replace(/,/g, '');
  else if (t.includes(',')) t = t.replace(',', '.');
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : 0;
}

function titleCase(s) {
  return s
    .toLowerCase()
    .split(' ')
    .map((w, i) => (w.length > 2 || i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
}

function cleanName(s) {
  let t = s
    .replace(/\b\d{5,}\b/g, ' ') // códigos de barras / SKU
    .replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9%.\/ ]/g, ' ')
    .replace(/(^|\s)[.\/]+(?=\s|$)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  t = t.replace(/^\d{1,4}\s+(?=\D)/, ''); // número de línea al inicio
  const letters = (t.match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g) || []).length;
  if (letters < 3) return '';
  return titleCase(t);
}

function findDate(lines) {
  const now = new Date();
  for (const l of lines) {
    let m = l.match(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/);
    let d, mo, y;
    if (m) {
      [, d, mo, y] = m.map(Number);
    } else {
      m = normalize(l).match(/\b(\d{1,2})[\/\-. ]([a-z]{3})[a-z]*[\/\-. ](\d{2,4})\b/);
      if (!m || !MONTHS[m[2]]) continue;
      d = +m[1]; mo = MONTHS[m[2]]; y = +m[3];
    }
    if (y < 100) y += 2000;
    if (mo > 12 && d <= 12) [d, mo] = [mo, d];
    const date = new Date(y, mo - 1, d);
    if (date.getMonth() !== mo - 1 || date > now || now - date > 400 * 86400000) continue;
    return toISO(date);
  }
  return null;
}

export function parseTicket(text) {
  const lines = String(text)
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  let store = '';
  for (const l of lines.slice(0, 8)) {
    const n = ' ' + normalize(l).replace(/[^a-z0-9]+/g, ' ') + ' ';
    const s = STORES.find((st) => n.includes(' ' + st + ' '));
    if (s) { store = titleCase(s.replace('h e b', 'HEB').replace('s mart', 'S-Mart')); break; }
  }

  const date = findDate(lines);
  let total = null;
  let pendingQty = null;
  const items = [];

  for (const raw of lines) {
    const n = normalize(raw);
    const priceM = raw.match(PRICE_END);

    if (/\btotal\b/.test(n) && !/sub ?total/.test(n)) {
      if (priceM && total == null) total = num(priceM[1]);
      continue;
    }

    // Línea de cantidad o peso: "2 X 15.50", "3 @ $9.90", "0.850 kg @ 34.90/kg".
    // Se asigna al producto anterior si cuadra el importe; si no, al siguiente.
    const qm = n.match(/^(\d+(?:[.,]\d+)?)\s*(kg|pzas?|pz)?\s*(?:x|@|\*)\s*\$?\s*(\d+[.,]\d{2})/);
    if (qm && !/[a-z]{3,}/.test(n.replace(/\bkg\b|\bpzas?\b|\bpz\b/g, ''))) {
      const q = num(qm[1]);
      const u = qm[2] === 'kg' ? 'kg' : 'pz';
      const expected = q * num(qm[3]);
      const last = items[items.length - 1];
      if (last && last.qty === 1 && Math.abs(last.price - expected) < 0.06) { last.qty = q; last.unit = u; }
      else pendingQty = { q, u };
      continue;
    }

    if (SKIP.test(n)) continue;

    const km = n.match(/(\d+[.,]\d{1,3})\s*kg\b/);
    if (!priceM) {
      if (km) pendingQty = { q: num(km[1]), u: 'kg' };
      continue;
    }

    let name = raw.slice(0, priceM.index);
    let qty = 1;
    let unit = 'pz';

    const inl = name.match(/(\d+(?:[.,]\d+)?)\s*(?:x|@)\s*\$?\s*\d+[.,]\d{2}\s*$/i);
    if (inl) { qty = num(inl[1]); name = name.slice(0, inl.index); }
    const pre = name.match(/^\s*(\d{1,2})\s+(?=[A-Za-zÁÉÍÓÚÑ]{3})/);
    if (pre && !inl) { qty = +pre[1] || 1; name = name.slice(pre[0].length); }
    if (km) {
      qty = num(km[1]);
      unit = 'kg';
      name = name.replace(/(\d+[.,]\d{1,3})\s*kg\b.*$/i, '');
    }

    name = cleanName(name);
    const price = num(priceM[1]);
    if (!name || price <= 0) continue;
    if (pendingQty) { qty = pendingQty.q; unit = pendingQty.u; pendingQty = null; }
    items.push({ name, qty: qty || 1, unit, price });
  }

  return { store, date, total, items };
}
