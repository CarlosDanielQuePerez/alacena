import { store, STORE_KEY } from './store.js';
import { CATEGORIES, LOCATIONS, UNITS, COUNTABLE, guessFood, estimateDays, unitLabel, isNonFood, normalize, iconFor } from './foods.js';
import { art } from './icons.js';
import {
  uid, esc, todayISO, addDays, diffDays, daysUntil, fmtDate, monthKey, monthLabel, humanDays,
  relExpiry, shortExpiry, relPast, status, fmtMoney, fmtNum, clamp,
} from './utils.js';
import { readTicket, parseTicket } from './ticket.js';

const view = document.getElementById('view');
const sheetRoot = document.getElementById('sheet-root');
const toastRoot = document.getElementById('toast-root');

// ---------- Iconos ----------
const P = {
  camera: '<path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.5-2h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="13" r="3.5"/>',
  pencil: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  back: '<path d="m15 6-6 6 6 6"/>',
  trash: '<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/>',
  image: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="m4 18 5-5 4 4 2.5-2.5L20 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  sparkle: '<path d="M12 3.5 13.8 10 20.5 12l-6.7 2L12 20.5 10.2 14 3.5 12l6.7-2z"/>',
  download: '<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>',
  upload: '<path d="M12 20V9M7 13.5l5-5 5 5M5 4h14"/>',
  fridge: '<rect x="5.5" y="2.5" width="13" height="19" rx="3"/><path d="M5.5 9.5h13M9 5.5v2M9 12.5v3"/>',
  snow: '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5"/>',
  cabinet: '<rect x="4" y="3.5" width="16" height="17" rx="2"/><path d="M12 3.5v17M9.5 11v2M14.5 11v2M6.5 20.5V22M17.5 20.5V22"/>',
  all: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  auto: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  clock: '<circle cx="12" cy="13" r="7.5"/><path d="M12 9.5V13l2.5 2M5 4.5 3 6.5M19 4.5l2 2"/>',
  bulb: '<path d="M9 17.5h6M10 21h4M8.5 14.5a6 6 0 1 1 7 0c-.8.7-1.2 1.6-1.2 2.5h-4.6c0-.9-.4-1.8-1.2-2.5z"/>',
  ruler: '<rect x="3" y="8" width="18" height="8" rx="1.5"/><path d="M7 8v3M11 8v4M15 8v3M19 8v4"/>',
};
const ico = (n) => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${P[n]}</svg>`;

// ---------- Ayudantes de productos ----------
const fmtQty = (x) => `${fmtNum(x.qty)} ${unitLabel(x.unit, x.qty)}`;
const itemDays = (i) => daysUntil(i.expiresAt);
const sortByExpiry = (list) => [...list].sort((a, b) => a.expiresAt.localeCompare(b.expiresAt) || a.name.localeCompare(b.name));

function freshPct(i) {
  const span = Math.max(1, diffDays(i.addedAt, i.expiresAt));
  return clamp(Math.round((itemDays(i) / span) * 100), 0, 100);
}

// Cada producto es un objeto en la repisa: frasco, lata, huacal, bolsa de pan,
// paquete de carnicería o botella. La tapa / etiqueta indica qué tan fresco está.
const VESSELS = { frutas: 'crate', verduras: 'crate', panaderia: 'bag', despensa: 'can', bebidas: 'bottle', carnes: 'wrap', pescados: 'wrap' };

function vessel(i) {
  const d = itemDays(i);
  const st = status(d);
  const approx = i.expiryType === 'aprox';
  const fill = Math.max(st === 'vencido' ? 100 : 10, freshPct(i));
  return `<button type="button" class="vessel vessel--${VESSELS[i.cat] || 'jar'} is-${st}" data-item="${i.id}"
      aria-label="${esc(i.name)}, ${esc(fmtQty(i))}, ${esc(relExpiry(d, approx))}">
    <span class="vessel__lid" aria-hidden="true"></span>
    <span class="vessel__body" aria-hidden="true">
      <span class="vessel__fill" style="height:${fill}%"></span>
      <span class="vessel__qty">${esc(fmtQty(i))}</span>
      <span class="vessel__emoji">${art(iconFor(i))}</span>
      <span class="vessel__tag"><b>${esc(i.name)}</b><small>${shortExpiry(d, approx)}</small></span>
    </span>
  </button>`;
}

function shelves(list, per = 3) {
  let html = '';
  for (let k = 0; k < list.length; k += per) html += `<div class="shelf">${list.slice(k, k + per).map(vessel).join('')}</div>`;
  return `<div class="shelves">${html}</div>`;
}

const tape = (cls = '') => `<span class="tape ${cls}" aria-hidden="true"></span>`;

function emptyState(icon, title, text, extra = '') {
  return `<div class="empty"><div class="empty__art">${art(icon)}</div><h3>${title}</h3><p>${text}</p>${extra}</div>`;
}

// ---------- Hoja inferior y avisos ----------
let sheetTimer = null;
function openSheet(html, bind) {
  clearTimeout(sheetTimer);
  sheetRoot.innerHTML = `<div class="sheet-backdrop" data-close></div><div class="sheet" role="dialog" aria-modal="true"><div class="sheet__grip"></div>${html}</div>`;
  sheetRoot.querySelector('[data-close]').addEventListener('click', () => closeSheet());
  const sheet = sheetRoot.querySelector('.sheet');
  [...sheet.children].forEach((el, n) => el.style.setProperty('--i', n));
  bind?.(sheet);
  requestAnimationFrame(() => requestAnimationFrame(() => sheetRoot.classList.add('open')));
}
function closeSheet(immediate = false) {
  if (!sheetRoot.firstChild) return;
  sheetRoot.classList.remove('open');
  clearTimeout(sheetTimer);
  if (immediate) sheetRoot.innerHTML = '';
  else sheetTimer = setTimeout(() => (sheetRoot.innerHTML = ''), 320);
}
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });

function toast(msg, action) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.innerHTML = `<span>${esc(msg)}</span>${action ? `<button type="button">${esc(action.label)}</button>` : ''}`;
  toastRoot.append(el);
  while (toastRoot.children.length > 2) toastRoot.firstChild.remove();
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));
  const remove = () => {
    clearTimeout(timer);
    el.classList.remove('show');
    setTimeout(() => el.remove(), 260);
  };
  const timer = setTimeout(remove, action ? 5000 : 3200);
  if (action) el.querySelector('button').addEventListener('click', () => { action.fn(); remove(); });
}

// ---------- Rutas ----------
const routes = [
  [/^\/$/, viewHome],
  [/^\/inventario$/, viewInventory],
  [/^\/compra\/nueva$/, viewDraft],
  [/^\/escanear$/, viewScan],
  [/^\/compras$/, viewPurchases],
  [/^\/compras\/([\w-]+)$/, viewPurchase],
  [/^\/item\/([\w-]+)$/, viewItemEdit],
  [/^\/ajustes$/, viewSettings],
];

function parseHash() {
  const h = location.hash.replace(/^#/, '') || '/';
  const [path, qs] = h.split('?');
  return { path: path || '/', params: new URLSearchParams(qs || '') };
}

let lastPath = null;
function render() {
  const { path, params } = parseHash();
  closeSheet(true);
  document.body.classList.remove('no-tabbar');
  const route = routes.find(([re]) => re.test(path));
  if (route) route[1](path.match(route[0]).slice(1), params);
  else viewHome([], params);

  document.querySelectorAll('.tab').forEach((t) => {
    const p = t.dataset.path;
    const on = p === '/' ? path === '/' : path === p || path.startsWith(p + '/');
    t.classList.toggle('active', on);
    if (on) t.setAttribute('aria-current', 'page');
    else t.removeAttribute('aria-current');
  });
  // Escalonado: cada objeto entra un poquito después del anterior
  for (const sel of ['.vessel', '.furni', '.note', '.stat', '.list > li', '.settings > *', '.group-label', '.ghost', '.tips li']) {
    view.querySelectorAll(sel).forEach((el, n) => el.style.setProperty('--i', n));
  }

  if (path !== lastPath) {
    window.scrollTo(0, 0);
    view.style.animation = 'none';
    void view.offsetWidth;
    view.style.animation = '';
    // Las animaciones de entrada solo corren al cambiar de pantalla, no al actualizar la misma
    clearTimeout(enterTimer);
    view.classList.remove('is-entering');
    void view.offsetWidth;
    view.classList.add('is-entering');
    enterTimer = setTimeout(() => view.classList.remove('is-entering'), 1600);
    countUp(view);
    const tab = document.querySelector('.tab.active');
    if (tab) { tab.classList.remove('pop'); void tab.offsetWidth; tab.classList.add('pop'); }
    lastPath = path;
  }
}

// ---------- Animaciones ----------
let enterTimer = null;
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = (ms) => new Promise((r) => setTimeout(r, reducedMotion() ? 0 : ms));

// Los números (imanes del refri, post-its) cuentan desde cero
function countUp(root) {
  if (reducedMotion()) return;
  root.querySelectorAll('[data-count]').forEach((el) => {
    const end = Number(el.dataset.count);
    if (!end) return;
    const t0 = performance.now() + 350;
    el.textContent = '0';
    const step = (t) => {
      const p = Math.min(1, Math.max(0, (t - t0) / 700));
      el.textContent = Math.round(end * (1 - (1 - p) ** 3));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

// Lluvia de hojitas al terminarse algo
function burst(el) {
  if (!el || reducedMotion()) return;
  const r = el.getBoundingClientRect();
  const b = document.createElement('div');
  b.className = 'burst';
  b.style.left = `${r.left + r.width / 2}px`;
  b.style.top = `${r.top + r.height / 3}px`;
  const colors = ['#88b06f', '#5f8b50', '#f5c95f', '#ef9a52', '#a9cc86'];
  b.innerHTML = Array.from({ length: 14 }, (_, k) => {
    const a = (Math.PI * 2 * k) / 14 + Math.random() * 0.4;
    const d = 50 + Math.random() * 45;
    return `<i style="--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d - 30}px;--r:${Math.random() * 360}deg;--c:${colors[k % colors.length]}"></i>`;
  }).join('');
  document.body.append(b);
  setTimeout(() => b.remove(), 1000);
}

// Animación de salida de un producto de la repisa ('done' sube, 'waste' se cae)
async function animateOut(id, kind) {
  const el = view.querySelector(`.vessel[data-item="${id}"]`);
  if (!el || reducedMotion()) return;
  el.classList.add(`leaving--${kind}`);
  if (kind === 'done') burst(el);
  await wait(kind === 'done' ? 520 : 600);
}

const go = (hash) => {
  if (location.hash === hash) render();
  else location.hash = hash;
};

// Clic en cualquier producto abre su hoja
view.addEventListener('click', (e) => {
  const b = e.target.closest('[data-item]');
  if (b) {
    b.classList.remove('tapped');
    void b.offsetWidth;
    b.classList.add('tapped');
    openItemSheet(b.dataset.item);
    return;
  }
  // Al tocar un mueble, se abre su puerta antes de entrar
  const f = e.target.closest('.furni');
  if (f && !reducedMotion() && !e.metaKey && !e.ctrlKey) {
    e.preventDefault();
    f.classList.add('opening');
    setTimeout(() => go(f.getAttribute('href')), 340);
  }
});

// ---------- Inicio ----------
function viewHome() {
  const { name } = store.settings;
  const items = store.items;
  const h = new Date().getHours();
  const greet = h < 5 ? 'Buenas noches' : h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  const night = h < 7 || h >= 19;
  const icon = `<span class="greet-ico greet-ico--${night ? 'moon' : 'sun'}">${ico(night ? 'moon' : 'sun')}</span>`;
  const soon = sortByExpiry(items.filter((i) => itemDays(i) <= 3));
  const expiredCount = items.filter((i) => itemDays(i) < 0).length;

  let title = 'Tu cocina te espera';
  if (items.length) {
    if (expiredCount) title = 'Hay cositas que revisar';
    else if (soon.length) title = 'Hoy toca cocinar rico';
    else title = 'Todo fresquito en casa';
  }

  const month = monthKey(todayISO());
  const logM = store.log.filter((l) => monthKey(l.date) === month);
  const used = logM.filter((l) => l.type === 'consumido').length;
  const wasted = logM.filter((l) => l.type === 'tirado').length;

  const places = Object.entries(LOCATIONS)
    .map(([k, l]) => {
      const list = items.filter((i) => i.loc === k);
      const urgent = list.filter((i) => itemDays(i) <= 3).length;
      return `<a class="furni furni--${k}" href="#/inventario?loc=${k}"
          aria-label="${l.long}: ${list.length} ${list.length === 1 ? 'producto' : 'productos'}${urgent ? `, ${urgent} por vencer` : ''}">
        <span class="furni__box" aria-hidden="true">
          <span class="furni__door"></span><span class="furni__door"></span>
          <span class="furni__light"></span>
          <span class="furni__magnet" data-count="${list.length}">${list.length}</span>
          ${urgent ? `<span class="furni__alert">${ico('clock')} ${urgent}</span>` : ''}
        </span>
        <span class="furni__label">${l.label}</span>
      </a>`;
    })
    .join('');

  const quick = `<section class="notes">
    <a class="note note--ticket" href="#/escanear">${tape()}<span class="note__icon">${art('ticket')}</span><b>Escanear ticket</b><small>Tómale foto y lo leemos por ti</small></a>
    <a class="note note--lined" href="#/compra/nueva">${tape('tape--sage')}<span class="note__icon">${art('notepad')}</span><b>Agregar a mano</b><small>Anota lo que trajiste</small></a>
  </section>`;

  let body;
  if (!items.length) {
    body = `<div class="shelves" aria-hidden="true" style="margin-top:34px"><div class="shelf shelf--ghost"><span class="ghost"></span><span class="ghost"></span><span class="ghost"></span></div></div>
    <section class="welcome">
      <div class="welcome__art">${art('carrot')}${art('milk')}${art('bread')}</div>
      <h2>Empecemos a llenar tu cocina</h2>
      <p>Guarda tu última compra y te avisamos qué conviene usar primero, para que nada se eche a perder.</p>
      <a class="btn btn--primary btn--block" href="#/escanear">${ico('camera')} Escanear mi ticket</a>
      <a class="btn btn--ghost btn--block" href="#/compra/nueva">${ico('pencil')} Agregar a mano</a>
    </section>`;
  } else {
    body = `<section class="section">
      <div class="section__head"><h2>Úsalo pronto</h2>${soon.length ? '<a href="#/inventario" class="link">Ver todo</a>' : ''}</div>
      ${soon.length
        ? shelves(soon.slice(0, 6))
        : emptyState('sprout', 'Nada urgente', 'No hay nada por vencer en los próximos días. ¡Bien hecho!')}
    </section>${quick}`;
  }

  const stats = used || wasted
    ? `<section class="stats" aria-label="Este mes">
        <div class="stat stat--sage"><small>Este mes aprovechaste</small><b data-count="${used}">${used}</b><small>${used === 1 ? 'producto' : 'productos'}</small></div>
        <div class="stat stat--rose"><small>Se echaron a perder</small><b data-count="${wasted}">${wasted}</b><small>${wasted === 0 ? '¡ninguno!' : wasted === 1 ? 'producto' : 'productos'}</small></div>
      </section>`
    : '';

  view.innerHTML = `
    <header class="hero">
      <p class="eyebrow">${icon} ${greet}${name ? `, ${esc(name)}` : ''}</p>
      <h1>${title}</h1>
    </header>
    <section class="places" aria-label="Lugares">${places}</section>
    ${draft && draft.rows.some((r) => r.name.trim()) ? `<a class="banner" href="#/compra/nueva"><span class="banner__emoji">${art('basket')}</span><span>Tienes una compra sin guardar</span>${ico('chevron')}</a>` : ''}
    ${body}
    ${stats}`;
}

// ---------- Inventario ----------
let invQuery = '';
function viewInventory(_, params) {
  const loc = LOCATIONS[params.get('loc')] ? params.get('loc') : 'todo';
  const sort = ['vence', 'nombre', 'recientes'].includes(params.get('sort')) ? params.get('sort') : 'vence';
  const items = store.items;
  const count = (k) => (k === 'todo' ? items.length : items.filter((i) => i.loc === k).length);
  const link = (l, s = sort) => `#/inventario?loc=${l}&sort=${s}`;

  const pills = [['todo', { label: 'Todo', icon: 'all' }], ...Object.entries(LOCATIONS)]
    .map(([k, l]) => `<a class="pill ${loc === k ? 'on' : ''}" href="${link(k)}" ${loc === k ? 'aria-current="true"' : ''}>${ico(l.icon)} ${l.label} <b>${count(k)}</b></a>`)
    .join('');

  view.innerHTML = `
    <header class="page-head">
      <h1>Mi cocina</h1>
      <p class="sub">${items.length ? `${items.length} ${items.length === 1 ? 'producto guardado' : 'productos guardados'}` : 'Aquí verás todo lo que tienes en casa'}</p>
    </header>
    ${items.length ? `
      <label class="search">${ico('search')}<input id="q" type="search" placeholder="Buscar… ej. leche, pollo" value="${esc(invQuery)}" autocomplete="off" enterkeyhint="search" aria-label="Buscar productos"></label>
      <nav class="filters" aria-label="Filtrar por lugar">${pills}</nav>
      <div class="toolbar">
        <span id="inv-count"></span>
        <label>Ordenar: <select class="select-inline" id="sort">
          <option value="vence" ${sort === 'vence' ? 'selected' : ''}>Por vencer</option>
          <option value="nombre" ${sort === 'nombre' ? 'selected' : ''}>Nombre</option>
          <option value="recientes" ${sort === 'recientes' ? 'selected' : ''}>Recientes</option>
        </select></label>
      </div>
      <div id="inv-list"></div>`
      : emptyState('basket', 'Tu cocina está vacía', 'Agrega tu primera compra y aquí aparecerá todo, ordenado por lo que vence primero.',
        `<div class="stack"><a class="btn btn--primary btn--block" href="#/escanear">${ico('camera')} Escanear ticket</a><a class="btn btn--ghost btn--block" href="#/compra/nueva">${ico('pencil')} Agregar a mano</a></div>`)}
  `;
  if (!items.length) return;

  const listEl = view.querySelector('#inv-list');
  const countEl = view.querySelector('#inv-count');
  const paint = () => {
    const q = normalize(invQuery).trim();
    let list = items.filter((i) => (loc === 'todo' || i.loc === loc) && (!q || normalize(i.name).includes(q)));
    if (sort === 'nombre') list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'es'));
    else if (sort === 'recientes') list = [...list].sort((a, b) => (b.addedAt + b.id).localeCompare(a.addedAt + a.id));
    else list = sortByExpiry(list);
    countEl.textContent = q ? `${list.length} ${list.length === 1 ? 'resultado' : 'resultados'}` : '';

    if (!list.length) {
      listEl.innerHTML = q
        ? emptyState('magnifier', 'No lo encontramos', `No hay nada que se llame “${esc(invQuery)}”. ¿Quizá ya se terminó?`)
        : emptyState('jar', `Nada ${LOCATIONS[loc]?.en || 'por aquí'}`, 'Cuando guardes algo aquí, lo verás en esta lista.');
      return;
    }
    if (sort !== 'vence') {
      listEl.innerHTML = shelves(list);
      return;
    }
    const groups = [
      ['Ya vencieron', list.filter((i) => itemDays(i) < 0)],
      ['Úsalos pronto', list.filter((i) => itemDays(i) >= 0 && itemDays(i) <= 3)],
      ['Esta semana', list.filter((i) => itemDays(i) > 3 && itemDays(i) <= 7)],
      ['Con calma', list.filter((i) => itemDays(i) > 7)],
    ].filter(([, g]) => g.length);
    listEl.innerHTML = groups.map(([t, g]) => `<h3 class="group-label">${t}</h3>${shelves(g)}`).join('');
  };
  paint();

  view.querySelector('#q').addEventListener('input', (e) => { invQuery = e.target.value; paint(); });
  view.querySelector('#sort').addEventListener('change', (e) => {
    history.replaceState(null, '', link(loc, e.target.value));
    render();
  });
}

// ---------- Hoja de un producto ----------
function openItemSheet(id) {
  const i = store.items.find((x) => x.id === id);
  if (!i) return;
  const d = itemDays(i);
  const st = status(d);
  const approx = i.expiryType === 'aprox';
  const others = Object.keys(LOCATIONS).filter((k) => k !== i.loc);
  const canDec = COUNTABLE.has(i.unit) && i.qty > 1;

  openSheet(`
    <div class="sheet__head">
      <span class="big-emoji">${art(iconFor(i))}</span>
      <div><h2>${esc(i.name)}</h2><p class="sub">${esc(fmtQty(i))} · ${LOCATIONS[i.loc].long}</p></div>
    </div>
    <div class="expiry-box is-${st}">
      <b>${relExpiry(d, approx)}</b>
      <small>${approx ? 'Fecha aproximada' : 'Fecha de caducidad'}: ${fmtDate(i.expiresAt, { weekday: true })}</small>
      <span class="fresh fresh--lg" aria-hidden="true"><span style="width:${Math.max(st === 'vencido' ? 100 : 6, freshPct(i))}%"></span></span>
      <small>Lo guardaste ${relPast(i.addedAt)}</small>
    </div>
    ${canDec ? `<button type="button" class="btn btn--ghost btn--block" data-act="dec">Usé ${i.unit === 'pz' ? 'una pieza' : `1 ${unitLabel(i.unit, 1)}`} <small>· quedan ${fmtNum(i.qty - 1)}</small></button>` : ''}
    <div class="grid2">
      <button type="button" class="btn btn--sage" data-act="done">${ico('check')} Se terminó</button>
      <button type="button" class="btn btn--rose" data-act="waste">Se echó a perder</button>
    </div>
    <p class="label" style="margin-top:4px">Mover a</p>
    <div class="grid2">${others.map((k) => `<button type="button" class="btn btn--ghost" data-move="${k}">${ico(LOCATIONS[k].icon)} ${LOCATIONS[k].label}</button>`).join('')}</div>
    <a class="btn btn--text btn--block" href="#/item/${i.id}">${ico('pencil')} Editar detalles</a>
  `, (sheet) => {
    sheet.addEventListener('click', async (e) => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      const move = e.target.closest('[data-move]')?.dataset.move;
      if (act === 'dec') {
        store.updateItem(i.id, { qty: Number((i.qty - 1).toFixed(3)) });
        render();
        toast(`Listo, quedan ${fmtQty(i)}`);
      } else if (act === 'done' || act === 'waste') {
        const res = store.removeItem(i.id, act === 'done' ? 'consumido' : 'tirado');
        closeSheet();
        await animateOut(i.id, act);
        render();
        toast(act === 'done' ? '¡Bien aprovechado!' : 'Anotado. La próxima será mejor', { label: 'Deshacer', fn: () => { store.restore(res); render(); } });
      } else if (move) {
        const patch = { loc: move };
        let msg = `${i.name} movido ${LOCATIONS[move].en}`;
        if (approx || move === 'congelador' || i.loc === 'congelador') {
          const days = estimateDays(i.name, i.cat, move);
          patch.expiresAt = addDays(todayISO(), days);
          patch.addedAt = todayISO();
          patch.expiryType = 'aprox';
          msg += ` · dura ~${humanDays(days)}`;
        }
        store.updateItem(i.id, patch);
        render();
        toast(msg);
      }
    });
  });
}

// ---------- Editor de filas (compra nueva y edición) ----------
function newRow(name = '', extra = {}) {
  const r = {
    id: uid(), name, qty: 1, unit: 'pz', price: null,
    loc: 'refri', cat: 'otros', icon: CATEGORIES.otros.icon,
    mode: 'aprox', days: 7, date: '', open: false, pantry: true,
    touched: { cat: false, loc: false, days: false, pantry: extra.pantry !== undefined },
    ...extra,
  };
  applyGuess(r);
  return r;
}

function applyGuess(r) {
  if (!r.touched.pantry) r.pantry = !isNonFood(r.name);
  const g = guessFood(r.name);
  if (g) {
    if (!r.touched.cat) r.cat = g.cat;
    if (!r.touched.loc) r.loc = g.loc;
  } else if (!r.touched.loc && !r.touched.cat && r.name.trim().length > 2) {
    r.loc = 'alacena';
  }
  r.icon = g?.icon || CATEGORIES[r.cat]?.icon || 'basket';
  if (!r.touched.days) r.days = estimateDays(r.name, r.cat, r.loc);
}

function rowExpiryShort(r, base) {
  if (!r.pantry) return 'Solo en la compra';
  if (r.mode === 'fecha') return r.date ? `vence ${fmtDate(r.date)}` : 'sin fecha';
  return `≈ ${humanDays(r.days)}`;
}

function rowSummaryHTML(r, base) {
  return `<button type="button" class="row__sum" data-toggle aria-expanded="${r.open}">
    <span class="item__emoji">${art(r.icon)}</span>
    <span class="item__body">
      <span class="item__name">${r.name.trim() ? esc(r.name) : '<span class="muted">Producto nuevo</span>'}</span>
      <span class="item__meta">${esc(fmtQty(r))}${r.pantry ? ` · ${LOCATIONS[r.loc].label}` : ''} · ${rowExpiryShort(r, base)}</span>
    </span>
    ${r.price ? `<span class="row__price">${fmtMoney(r.price)}</span>` : ''}
    <span class="row__chev">${ico('chevron')}</span>
  </button>`;
}

function rowExpiryHTML(r, base) {
  if (r.mode === 'fecha') {
    const n = r.date ? diffDays(todayISO(), r.date) : null;
    return `<input type="date" data-f="date" value="${r.date || ''}" aria-label="Fecha de caducidad">
      <p class="hint hint--result">${n == null ? 'Busca la fecha en el empaque' : `<span class="dot dot--${status(n)}"></span>${relExpiry(n, false)}`}</p>`;
  }
  const sug = estimateDays(r.name, r.cat, r.loc);
  const opts = [...new Set([sug, 3, 7, 14, 30, 90])].sort((a, b) => a - b);
  return `<p class="hint">Suele durar <b>~${humanDays(sug)}</b> ${LOCATIONS[r.loc].en}.</p>
    <div class="chips" role="group" aria-label="Duración aproximada">${opts
      .map((n) => `<button type="button" data-days="${n}" class="${r.days === n ? 'on' : ''}">${n === sug ? ico('sparkle') : ''}${humanDays(n)}</button>`)
      .join('')}${!opts.includes(r.days) ? `<button type="button" class="on" data-days="${r.days}">${humanDays(r.days)}</button>` : ''}</div>
    <p class="hint hint--result">${ico('calendar')} Vencería aprox. el ${fmtDate(addDays(base, r.days), { weekday: true })}</p>`;
}

function rowBodyHTML(r, base, opts) {
  return `<div class="row__body">
    <label class="field"><span>Producto</span>
      <input data-f="name" value="${esc(r.name)}" placeholder="Ej. leche, jitomate, pollo…" autocomplete="off" autocapitalize="sentences" enterkeyhint="done"></label>
    <div class="field-row">
      <div class="field"><span>Cantidad</span>
        <div class="stepper"><button type="button" data-step="-1" aria-label="Menos">−</button><input data-f="qty" type="number" inputmode="decimal" min="0" step="any" value="${fmtNum(r.qty)}" aria-label="Cantidad"><button type="button" data-step="1" aria-label="Más">+</button></div></div>
      <label class="field"><span>Unidad</span>
        <select data-f="unit">${UNITS.map(([v, s, p]) => `<option value="${v}" ${r.unit === v ? 'selected' : ''}>${v === 'pz' ? 'piezas' : p}</option>`).join('')}</select></label>
    </div>
    ${opts.price ? `<label class="field"><span>Precio <span class="muted">(opcional)</span></span>
      <span class="money"><span>$</span><input data-f="price" type="number" inputmode="decimal" min="0" step="0.01" value="${r.price ?? ''}" placeholder="0.00"></span></label>` : ''}
    ${opts.pantryToggle ? `<label class="switch"><input type="checkbox" data-f="pantry" ${r.pantry ? 'checked' : ''}><span>Guardar en mi cocina<small>Apágalo para cosas que no son comida (jabón, papel…)</small></span></label>` : ''}
    <div data-pantry ${r.pantry ? '' : 'hidden'} style="display:grid;gap:14px">
      <div class="field"><span>¿Dónde lo guardas?</span>
        <div class="seg" role="group">${Object.entries(LOCATIONS).map(([k, l]) => `<button type="button" data-loc="${k}" class="${r.loc === k ? 'on' : ''}" aria-pressed="${r.loc === k}"><span class="e">${ico(l.icon)}</span>${l.label}</button>`).join('')}</div></div>
      <label class="field"><span>Categoría</span>
        <select data-f="cat">${Object.entries(CATEGORIES).map(([k, c]) => `<option value="${k}" ${r.cat === k ? 'selected' : ''}>${c.label}</option>`).join('')}</select></label>
      <div class="field"><span>¿Cuándo vence?</span>
        <div class="seg seg--row" role="group">
          <button type="button" data-mode="aprox" class="${r.mode === 'aprox' ? 'on' : ''}">${ico('sparkle')} Calcúlalo</button>
          <button type="button" data-mode="fecha" class="${r.mode === 'fecha' ? 'on' : ''}">${ico('calendar')} Tengo la fecha</button>
        </div>
        <div data-expiry style="display:grid;gap:10px;margin-top:6px">${rowExpiryHTML(r, base)}</div>
      </div>
    </div>
    ${opts.single ? '' : `<div class="row__actions">
      <button type="button" class="btn btn--danger-text" data-remove>${ico('trash')} Quitar</button>
      <button type="button" class="btn btn--sage btn--sm" data-toggle>${ico('check')} Listo</button></div>`}
  </div>`;
}

function rowHTML(r, base, opts) {
  return `<li class="row ${opts.single ? 'row--single' : ''} ${r.open ? 'open' : ''} ${r.pantry ? '' : 'off'}" data-row="${r.id}">
    ${opts.single ? '' : rowSummaryHTML(r, base)}${rowBodyHTML(r, base, opts)}</li>`;
}

// Conecta los eventos de una lista de filas. getBase() da la fecha desde la que se calcula.
function bindRows(container, rows, { getBase, opts, onChange = () => {}, onRemove = () => {} }) {
  const find = (el) => {
    const li = el.closest('[data-row]');
    return li ? [rows.find((r) => r.id === li.dataset.row), li] : [];
  };
  const paintSummary = (r, li) => {
    const s = li.querySelector('.row__sum');
    if (s) s.outerHTML = rowSummaryHTML(r, getBase());
  };
  const paintExpiry = (r, li) => {
    li.querySelector('[data-expiry]').innerHTML = rowExpiryHTML(r, getBase());
  };
  // Solo actualiza el texto, sin reemplazar el selector de fecha (para no cerrarlo).
  const paintDateHint = (r, li) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = rowExpiryHTML(r, getBase());
    li.querySelector('[data-expiry] .hint--result').replaceWith(tmp.querySelector('.hint--result'));
  };
  const paintRow = (r, li) => {
    li.outerHTML = rowHTML(r, getBase(), opts);
  };

  container.addEventListener('input', (e) => {
    const [r, li] = find(e.target);
    const f = e.target.dataset.f;
    if (!r || !f) return;
    if (f === 'name') {
      r.name = e.target.value;
      applyGuess(r);
      li.querySelector('[data-f="cat"]').value = r.cat;
      li.querySelectorAll('[data-loc]').forEach((b) => b.classList.toggle('on', b.dataset.loc === r.loc));
      const pantryBox = li.querySelector('[data-f="pantry"]');
      if (pantryBox) pantryBox.checked = r.pantry;
      li.classList.toggle('off', !r.pantry);
      li.querySelector('[data-pantry]').hidden = !r.pantry;
      if (r.mode === 'aprox') paintExpiry(r, li);
    } else if (f === 'qty') r.qty = Math.max(0, parseFloat(e.target.value) || 0);
    else if (f === 'price') r.price = e.target.value === '' ? null : Math.max(0, parseFloat(e.target.value) || 0);
    else if (f === 'date') { r.date = e.target.value; paintDateHint(r, li); }
    else return;
    paintSummary(r, li);
    onChange();
  });

  container.addEventListener('change', (e) => {
    const [r, li] = find(e.target);
    const f = e.target.dataset.f;
    if (!r || !f) return;
    if (f === 'unit') r.unit = e.target.value;
    else if (f === 'cat') { r.cat = e.target.value; r.touched.cat = true; applyGuess(r); paintExpiry(r, li); }
    else if (f === 'pantry') { r.pantry = e.target.checked; r.touched.pantry = true; li.classList.toggle('off', !r.pantry); li.querySelector('[data-pantry]').hidden = !r.pantry; }
    else if (f === 'date') { r.date = e.target.value; paintDateHint(r, li); }
    else return;
    paintSummary(r, li);
    onChange();
  });

  container.addEventListener('click', (e) => {
    const [r, li] = find(e.target);
    if (!r) return;
    const t = e.target.closest('button');
    if (!t) return;
    if (t.hasAttribute('data-toggle')) {
      r.open = !r.open;
      paintRow(r, li);
      if (r.open) container.querySelector(`[data-row="${r.id}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } else if (t.dataset.step) {
      const size = r.unit === 'kg' || r.unit === 'L' ? 0.5 : r.unit === 'g' || r.unit === 'ml' ? 100 : 1;
      r.qty = Math.max(0, Number((r.qty + Number(t.dataset.step) * size).toFixed(3)));
      li.querySelector('[data-f="qty"]').value = fmtNum(r.qty);
      paintSummary(r, li);
      onChange();
    } else if (t.dataset.loc) {
      r.loc = t.dataset.loc;
      r.touched.loc = true;
      r.touched.days = false;
      applyGuess(r);
      li.querySelectorAll('[data-loc]').forEach((b) => { b.classList.toggle('on', b === t); b.setAttribute('aria-pressed', b === t); });
      paintExpiry(r, li);
      paintSummary(r, li);
      onChange();
    } else if (t.dataset.mode) {
      r.mode = t.dataset.mode;
      if (r.mode === 'fecha' && !r.date) r.date = addDays(getBase(), r.days);
      li.querySelectorAll('[data-mode]').forEach((b) => b.classList.toggle('on', b === t));
      paintExpiry(r, li);
      paintSummary(r, li);
      onChange();
    } else if (t.dataset.days) {
      r.days = Number(t.dataset.days);
      r.touched.days = true;
      paintExpiry(r, li);
      paintSummary(r, li);
      onChange();
    } else if (t.hasAttribute('data-remove')) {
      onRemove(r, li);
    }
  });
}

function rowExpiresAt(r, base) {
  if (r.mode === 'fecha' && r.date) return { expiresAt: r.date, expiryType: 'exacta' };
  return { expiresAt: addDays(base, r.days), expiryType: 'aprox' };
}

// ---------- Compra nueva (manual o desde ticket) ----------
// El borrador se guarda para no perderlo si se cierra la app a medias.
const DRAFT_KEY = 'alacena:draft:v1';
let draft = (() => {
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY));
    return d && Array.isArray(d.rows) ? d : null;
  } catch {
    return null;
  }
})();
function saveDraft() {
  try {
    if (draft) localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    else localStorage.removeItem(DRAFT_KEY);
  } catch { /* sin almacenamiento disponible */ }
}
function setDraft(d) {
  draft = d;
  saveDraft();
}
function newDraft(source = 'manual', extra = {}) {
  return { source, store: '', date: todayISO(), total: null, rawText: '', rows: [], ...extra };
}

function viewDraft() {
  if (!draft) setDraft(newDraft('manual', { rows: [newRow('', { open: true })] }));
  document.body.classList.add('no-tabbar');
  const fromTicket = draft.source === 'ticket';
  const opts = { price: true, pantryToggle: true };
  const base = () => draft.date || todayISO();

  view.innerHTML = `
    <header class="page-head page-head--bar">
      <a href="#/" class="icon-btn" aria-label="Volver al inicio">${ico('back')}</a>
      <div><h1>${fromTicket ? 'Revisa tu ticket' : 'Nueva compra'}</h1>
      <p class="sub">${fromTicket ? 'Corrige lo que haga falta y guarda' : 'Anota lo que trajiste a casa'}</p></div>
    </header>
    <div class="card form-card">
      <div class="field-row">
        <label class="field"><span>¿Dónde compraste?</span><input id="d-store" value="${esc(draft.store)}" placeholder="Mercado, súper…" autocomplete="off"></label>
        <label class="field"><span>Fecha</span><input id="d-date" type="date" value="${draft.date}" max="${todayISO()}"></label>
      </div>
    </div>
    <div class="section__head" style="margin-top:22px"><h2>Productos</h2><span class="sub" id="d-count"></span></div>
    <ul class="rows" id="rows">${draft.rows.map((r) => rowHTML(r, base(), opts)).join('')}</ul>
    <button type="button" class="btn btn--dashed btn--block" id="add-row">${ico('plus')} Agregar otro producto</button>
    ${draft.rawText ? `<details class="raw"><summary>Ver el texto que leímos del ticket</summary><pre>${esc(draft.rawText)}</pre></details>` : ''}
    <button type="button" class="btn btn--text btn--block" id="discard" style="margin-top:10px">Descartar esta compra</button>
    <div class="savebar"><div class="savebar__inner">
      <div class="savebar__total"><small>Total</small><b id="d-total">$0</b></div>
      <button type="button" class="btn btn--primary" id="save">${ico('check')} Guardar compra</button>
    </div></div>`;

  const rowsEl = view.querySelector('#rows');
  const updateTotals = () => {
    const named = draft.rows.filter((r) => r.name.trim());
    const sum = named.reduce((s, r) => s + (r.price || 0), 0);
    view.querySelector('#d-total').textContent = fmtMoney(sum || draft.total || 0);
    view.querySelector('#d-count').textContent = named.length ? `${named.length} ${named.length === 1 ? 'producto' : 'productos'}` : '';
  };
  updateTotals();

  view.querySelector('#d-store').addEventListener('input', (e) => { draft.store = e.target.value; saveDraft(); });
  view.querySelector('#d-date').addEventListener('change', (e) => {
    draft.date = e.target.value || todayISO();
    saveDraft();
    draft.rows.forEach((r) => {
      const li = rowsEl.querySelector(`[data-row="${r.id}"]`);
      if (li && r.mode === 'aprox') li.querySelector('[data-expiry]').innerHTML = rowExpiryHTML(r, base());
    });
  });

  bindRows(rowsEl, draft.rows, {
    getBase: base,
    opts,
    onChange: () => { updateTotals(); saveDraft(); },
    onRemove: (r, li) => {
      const d = draft;
      const idx = d.rows.indexOf(r);
      d.rows.splice(idx, 1);
      li.classList.add('removing');
      setTimeout(() => li.remove(), reducedMotion() ? 0 : 260);
      updateTotals();
      saveDraft();
      if (r.name.trim()) {
        toast(`Quitamos ${r.name}`, {
          label: 'Deshacer',
          fn: () => {
            if (draft !== d) return;
            d.rows.splice(idx, 0, r);
            saveDraft();
            if (parseHash().path === '/compra/nueva') render();
          },
        });
      }
    },
  });

  view.querySelector('#add-row').addEventListener('click', () => {
    draft.rows.forEach((r) => {
      if (r.open && r.name.trim()) {
        r.open = false;
        const li = rowsEl.querySelector(`[data-row="${r.id}"]`);
        if (li) li.outerHTML = rowHTML(r, base(), opts);
      }
    });
    const r = newRow('', { open: true });
    draft.rows.push(r);
    saveDraft();
    rowsEl.insertAdjacentHTML('beforeend', rowHTML(r, base(), opts));
    const input = rowsEl.querySelector(`[data-row="${r.id}"] [data-f="name"]`);
    input.closest('.row').classList.add('is-new');
    input.focus();
    input.closest('.row').scrollIntoView({ block: 'center', behavior: 'smooth' });
  });

  view.querySelector('#discard').addEventListener('click', () => {
    const named = draft.rows.filter((r) => r.name.trim()).length;
    if (named && !confirm('¿Descartar esta compra? Se perderán los productos que anotaste.')) return;
    setDraft(null);
    go('#/');
  });

  view.querySelector('#save').addEventListener('click', () => {
    const rows = draft.rows.filter((r) => r.name.trim());
    if (!rows.length) {
      toast('Escribe al menos un producto');
      rowsEl.querySelector('[data-f="name"]')?.focus();
      return;
    }
    const b = base();
    const now = new Date().toISOString();
    const purchaseId = uid();
    const sum = rows.reduce((s, r) => s + (r.price || 0), 0);
    store.addPurchase({
      id: purchaseId,
      date: b,
      createdAt: now,
      store: draft.store.trim(),
      source: draft.source,
      total: Math.round((sum || draft.total || 0) * 100) / 100,
      items: rows.map((r) => ({ name: r.name.trim(), icon: r.icon, qty: r.qty, unit: r.unit, price: r.price, pantry: r.pantry })),
    });
    const newItems = rows
      .filter((r) => r.pantry)
      .map((r) => ({
        id: uid(), name: r.name.trim(), icon: r.icon, cat: r.cat, loc: r.loc,
        qty: r.qty || 1, unit: r.unit, price: r.price, addedAt: b, purchaseId,
        ...rowExpiresAt(r, b),
      }));
    store.addItems(newItems);
    setDraft(null);
    go('#/inventario');
    toast(newItems.length ? `¡Listo! Guardamos ${newItems.length} ${newItems.length === 1 ? 'producto' : 'productos'}` : 'Compra guardada');
  });
}

// ---------- Escanear ticket ----------
let scanning = false;
function viewScan() {
  view.innerHTML = `
    <header class="page-head page-head--bar">
      <a href="#/" class="icon-btn" aria-label="Volver al inicio">${ico('back')}</a>
      <div><h1>Escanear ticket</h1><p class="sub">Leemos tu ticket y llenamos la compra por ti</p></div>
    </header>
    <div id="scan-body"></div>`;
  const body = view.querySelector('#scan-body');

  const showIntro = () => {
    body.innerHTML = `
      <section class="scan-hero">
        <span class="pin" aria-hidden="true"></span>
        <div class="ticket-art" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
        <span class="scan-line" aria-hidden="true"></span>
        <div class="cork-note">
          <h2>Tómale foto a tu ticket</h2>
          <p>Después podrás revisar y corregir cada producto antes de guardarlo.</p>
        </div>
      </section>
      <div class="scan-actions">
        <label class="btn btn--primary btn--block">${ico('camera')} Tomar foto<input class="file-input" type="file" accept="image/*" capture="environment" data-file></label>
        <label class="btn btn--ghost btn--block">${ico('image')} Elegir de la galería<input class="file-input" type="file" accept="image/*" data-file></label>
      </div>
      <ul class="tips">
        <li>${ico('bulb')}Busca buena luz y evita sombras sobre el papel.</li>
        <li>${ico('ruler')}Estira el ticket y que se vea completo y derecho.</li>
        <li>${ico('pencil')}¿Ticket borroso? También puedes <a class="link" href="#/compra/nueva">agregar a mano</a>.</li>
      </ul>`;
    body.querySelectorAll('[data-file]').forEach((inp) => inp.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) process(file);
    }));
  };

  const process = async (file) => {
    if (scanning) return;
    scanning = true;
    const url = URL.createObjectURL(file);
    body.innerHTML = `
      <section class="card progress-card">
        <img src="${url}" alt="Foto de tu ticket">
        <h2 id="p-label">Preparando la foto…</h2>
        <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100"><span id="p-bar"></span></div>
        <p class="sub">La primera vez tarda un poquito más mientras descargamos el lector.</p>
      </section>`;
    const bar = body.querySelector('#p-bar');
    const label = body.querySelector('#p-label');
    const still = () => parseHash().path === '/escanear' && body.isConnected;
    try {
      const text = await readTicket(file, (p, msg) => {
        if (!still()) return;
        bar.style.width = `${Math.round(p * 100)}%`;
        bar.parentElement.setAttribute('aria-valuenow', Math.round(p * 100));
        label.textContent = msg;
      });
      const parsed = parseTicket(text);
      setDraft(newDraft('ticket', {
        store: parsed.store,
        date: parsed.date || todayISO(),
        total: parsed.total,
        rawText: text.trim(),
        rows: parsed.items.map((it) => newRow(it.name, { qty: it.qty, unit: it.unit, price: it.price })),
      }));
      if (!draft.rows.length) draft.rows.push(newRow('', { open: true }));
      saveDraft();
      scanning = false;
      if (!still()) {
        toast('Tu ticket está listo para revisar', { label: 'Ver', fn: () => go('#/compra/nueva') });
        return;
      }
      if (!parsed.items.length) {
        body.innerHTML = emptyState('sad', 'No pudimos leer productos', 'Prueba con otra foto con más luz, o escríbelos a mano. Ya guardamos el texto que alcanzamos a leer.',
          `<div class="stack"><button type="button" class="btn btn--primary btn--block" id="retry">${ico('camera')} Intentar otra vez</button><a class="btn btn--ghost btn--block" href="#/compra/nueva">${ico('pencil')} Escribirlos a mano</a></div>`);
        body.querySelector('#retry').addEventListener('click', showIntro);
        return;
      }
      go('#/compra/nueva');
      toast(`Encontramos ${parsed.items.length} ${parsed.items.length === 1 ? 'producto' : 'productos'}. Revísalos`);
    } catch (err) {
      console.error(err);
      scanning = false;
      if (!still()) return;
      const offline = err?.message === 'offline' || !navigator.onLine;
      body.innerHTML = emptyState(offline ? 'nosignal' : 'sad', offline ? 'Necesitas internet' : 'Algo salió mal',
        offline ? 'Para leer tickets necesitamos conexión la primera vez. Puedes agregar tu compra a mano mientras tanto.' : 'No pudimos leer la foto. Intenta con otra imagen.',
        `<div class="stack"><button type="button" class="btn btn--primary btn--block" id="retry">Intentar otra vez</button><a class="btn btn--ghost btn--block" href="#/compra/nueva">${ico('pencil')} Agregar a mano</a></div>`);
      body.querySelector('#retry').addEventListener('click', showIntro);
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }
  };

  showIntro();
}

// ---------- Editar producto ----------
function viewItemEdit([id]) {
  const i = store.items.find((x) => x.id === id);
  if (!i) { go('#/inventario'); return; }
  document.body.classList.add('no-tabbar');
  const d = itemDays(i);
  const r = newRow(i.name, {
    qty: i.qty, unit: i.unit, price: i.price ?? null, loc: i.loc, cat: i.cat, icon: iconFor(i),
    mode: i.expiryType === 'exacta' ? 'fecha' : 'aprox', days: Math.max(1, d), date: i.expiresAt,
    open: true, pantry: true, touched: { cat: true, loc: true, days: true, pantry: true },
  });
  r.icon = iconFor(i);
  const opts = { price: true, single: true };

  view.innerHTML = `
    <header class="page-head page-head--bar">
      <a href="#/inventario" class="icon-btn" aria-label="Volver">${ico('back')}</a>
      <div><h1>Editar producto</h1><p class="sub">Guardado ${relPast(i.addedAt)}</p></div>
    </header>
    <ul class="rows" id="rows">${rowHTML(r, todayISO(), opts)}</ul>
    <button type="button" class="btn btn--danger-text btn--block" id="del">${ico('trash')} Eliminar de mi cocina</button>
    <div class="savebar"><div class="savebar__inner">
      <a class="btn btn--ghost" href="#/inventario" style="flex:0 0 auto">Cancelar</a>
      <button type="button" class="btn btn--primary" id="save">${ico('check')} Guardar cambios</button>
    </div></div>`;

  bindRows(view.querySelector('#rows'), [r], { getBase: todayISO, opts });

  view.querySelector('#save').addEventListener('click', () => {
    if (!r.name.trim()) { toast('El producto necesita un nombre'); return; }
    const exp = rowExpiresAt(r, todayISO());
    const changedExpiry = exp.expiresAt !== i.expiresAt;
    store.updateItem(i.id, {
      name: r.name.trim(), icon: r.icon, qty: r.qty || 1, unit: r.unit, price: r.price,
      loc: r.loc, cat: r.cat, ...exp,
      ...(changedExpiry && diffDays(i.addedAt, exp.expiresAt) < 1 ? { addedAt: todayISO() } : {}),
    });
    go('#/inventario');
    toast('Cambios guardados');
  });
  view.querySelector('#del').addEventListener('click', () => {
    const res = store.removeItem(i.id, null);
    go('#/inventario');
    toast(`Eliminamos ${i.name}`, { label: 'Deshacer', fn: () => { store.restore(res); render(); } });
  });
}

// ---------- Compras ----------
function viewPurchases() {
  const ps = store.purchases;
  const thisMonth = monthKey(todayISO());
  const monthPs = ps.filter((p) => monthKey(p.date) === thisMonth);
  const monthTotal = monthPs.reduce((s, p) => s + (p.total || 0), 0);

  const groups = new Map();
  ps.forEach((p) => {
    const k = monthKey(p.date);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(p);
  });

  view.innerHTML = `
    <header class="page-head"><h1>Mis compras</h1><p class="sub">El historial de todo lo que has traído a casa</p></header>
    ${ps.length ? `
      <section class="month-card">
        <span class="month-card__emoji">${art('basket')}</span>
        <div><small>${monthLabel(thisMonth)} · ${monthPs.length} ${monthPs.length === 1 ? 'compra' : 'compras'}</small><b>${fmtMoney(monthTotal)}</b></div>
      </section>
      ${[...groups.entries()].map(([k, list]) => `
        <h3 class="group-label" style="margin-top:24px">${monthLabel(k)}</h3>
        <ul class="list">${list.map((p) => `<li><a class="purchase" href="#/compras/${p.id}">
          <span class="purchase__icon" aria-hidden="true">${art(p.source === 'ticket' ? 'ticket' : 'notepad')}</span>
          <span class="purchase__body"><b>${esc(p.store || (p.source === 'ticket' ? 'Compra con ticket' : 'Compra anotada'))}</b>
            <small>${fmtDate(p.date, { weekday: true })} · ${p.items.length} ${p.items.length === 1 ? 'producto' : 'productos'}</small></span>
          <span class="purchase__total">${p.total ? fmtMoney(p.total) : ''}</span>
        </a></li>`).join('')}</ul>`).join('')}`
      : emptyState('ticket', 'Aún no hay compras', 'Cada vez que guardes una compra (con ticket o a mano) aparecerá aquí con su total.',
        `<div class="stack"><a class="btn btn--primary btn--block" href="#/escanear">${ico('camera')} Escanear ticket</a><a class="btn btn--ghost btn--block" href="#/compra/nueva">${ico('pencil')} Agregar a mano</a></div>`)}`;
}

function viewPurchase([id]) {
  const p = store.purchases.find((x) => x.id === id);
  if (!p) { go('#/compras'); return; }
  view.innerHTML = `
    <header class="page-head page-head--bar">
      <a href="#/compras" class="icon-btn" aria-label="Volver a compras">${ico('back')}</a>
      <div><h1>${esc(p.store || (p.source === 'ticket' ? 'Compra con ticket' : 'Compra anotada'))}</h1>
      <p class="sub">${fmtDate(p.date, { weekday: true, year: true })} · ${p.source === 'ticket' ? 'desde ticket' : 'anotada a mano'}</p></div>
    </header>
    <section class="card receipt">
      ${p.items.map((it) => `<div class="receipt__row">
        <span class="receipt__icon">${art(iconFor(it))}</span>
        <div><b>${esc(it.name)}</b><small>${esc(fmtQty(it))}${it.pantry === false ? ' · solo en la compra' : ''}</small></div>
        <span>${it.price ? fmtMoney(it.price) : ''}</span>
      </div>`).join('')}
    </section>
    <div class="receipt__total"><span>Total</span><b>${fmtMoney(p.total)}</b></div>
    <button type="button" class="btn btn--danger-text btn--block" id="del" style="margin-top:22px">${ico('trash')} Borrar del historial</button>
    <p class="sub" style="text-align:center">Los productos en tu cocina no se borran.</p>`;
  view.querySelector('#del').addEventListener('click', () => {
    if (!confirm('¿Borrar esta compra del historial?')) return;
    store.removePurchase(p.id);
    go('#/compras');
    toast('Compra borrada del historial');
  });
}

// ---------- Ajustes ----------
let installPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installPrompt = e;
  if (parseHash().path === '/ajustes') render();
});

function viewSettings() {
  const s = store.settings;
  const total = store.log.length;
  const used = store.log.filter((l) => l.type === 'consumido').length;
  const pct = total ? Math.round((used / total) * 100) : null;

  view.innerHTML = `
    <header class="page-head"><h1>Ajustes</h1><p class="sub">Haz de Alacena tu rincón</p></header>
    <div class="settings">
      <section class="card">
        <h2>Tú</h2>
        <label class="field"><span>¿Cómo te llamamos?</span><input id="s-name" value="${esc(s.name)}" placeholder="Tu nombre" autocomplete="given-name" maxlength="30"></label>
        <div class="field"><span>Apariencia</span>
          <div class="seg seg--row" role="group">
            ${[['auto', ico('auto') + ' Auto'], ['light', ico('sun') + ' Clara'], ['dark', ico('moon') + ' Oscura']].map(([v, l]) => `<button type="button" data-theme-opt="${v}" class="${s.theme === v ? 'on' : ''}">${l}</button>`).join('')}
          </div></div>
      </section>
      ${pct != null ? `<section class="card"><h2>Tu cocina en números</h2>
        <div class="stats" style="margin:0">
          <div class="stat stat--sage"><small>Aprovechado</small><b>${pct}%</b><small>de lo que salió de tu cocina</small></div>
          <div class="stat"><small>Compras guardadas</small><b>${store.purchases.length}</b><small>en total</small></div>
        </div></section>` : ''}
      ${installPrompt ? `<section class="card"><h2>Instalar la app</h2><p class="sub" style="margin:0">Tenla en tu pantalla de inicio como cualquier otra app.</p><button type="button" class="btn btn--primary btn--block" id="install">${ico('download')} Instalar Alacena</button></section>` : ''}
      <section class="card">
        <h2>Tus datos</h2>
        <p class="sub" style="margin:0">Todo se guarda solo en este dispositivo. Haz un respaldo para pasarlo a otro teléfono.</p>
        <div class="grid2">
          <button type="button" class="btn btn--ghost" id="export">${ico('download')} Respaldar</button>
          <label class="btn btn--ghost">${ico('upload')} Restaurar<input type="file" accept="application/json,.json" class="file-input" id="import"></label>
        </div>
        <button type="button" class="btn btn--danger-text btn--block" id="reset">${ico('trash')} Borrar todos mis datos</button>
      </section>
      <p class="about">Alacena · hecho con cariño para tu cocina<br>Las fechas aproximadas son una guía; confía también en tu olfato.</p>
    </div>`;

  view.querySelector('#s-name').addEventListener('change', (e) => { store.setSettings({ name: e.target.value.trim() }); toast('¡Mucho gusto!'); });
  view.querySelectorAll('[data-theme-opt]').forEach((b) => b.addEventListener('click', () => {
    store.setSettings({ theme: b.dataset.themeOpt });
    applyTheme();
    view.querySelectorAll('[data-theme-opt]').forEach((x) => x.classList.toggle('on', x === b));
  }));
  view.querySelector('#install')?.addEventListener('click', async () => {
    installPrompt.prompt();
    await installPrompt.userChoice.catch(() => {});
    installPrompt = null;
    render();
  });
  view.querySelector('#export').addEventListener('click', () => {
    const blob = new Blob([store.exportJSON()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `alacena-respaldo-${todayISO()}.json`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('Respaldo descargado');
  });
  view.querySelector('#import').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm('Restaurar reemplazará los datos actuales. ¿Continuar?')) return;
    try {
      store.importJSON(await file.text());
      applyTheme();
      render();
      toast('Datos restaurados');
    } catch (err) {
      toast(err.message || 'No pudimos leer ese archivo');
    }
  });
  view.querySelector('#reset').addEventListener('click', () => {
    if (!confirm('¿Borrar todo? Se eliminarán tus productos, compras y ajustes de este dispositivo. No se puede deshacer.')) return;
    store.reset();
    setDraft(null);
    applyTheme();
    go('#/');
    toast('Empezamos de cero');
  });
}

// ---------- Botón + ----------
document.getElementById('fab').addEventListener('click', async (e) => {
  // La tapa del frasco gira como si se abriera
  const fab = e.currentTarget;
  fab.classList.remove('twist');
  void fab.offsetWidth;
  fab.classList.add('twist');
  await wait(160);
  openSheet(`
    <h2 style="margin:0 4px 4px">¿Cómo quieres agregar tu compra?</h2>
    <a class="sheet-option" href="#/escanear"><span>${art('ticket')}</span><span><b>Escanear ticket</b><small>Toma una foto y nosotros lo leemos</small></span></a>
    <a class="sheet-option" href="#/compra/nueva"><span>${art('notepad')}</span><span><b>Agregar a mano</b><small>Escribe tus productos uno por uno</small></span></a>
  `);
});

// ---------- Tema ----------
function applyTheme() {
  const t = store.settings.theme;
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
}

// ---------- Inicio de la app ----------
window.addEventListener('hashchange', render);
window.addEventListener('storage', (e) => {
  if (e.key === STORE_KEY) { store.reload(); applyTheme(); render(); }
});
// Al volver a la app (p. ej. al día siguiente) se recalculan los días.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && !document.body.classList.contains('no-tabbar') && !sheetRoot.firstChild) render();
});

applyTheme();
render();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
