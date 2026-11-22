// Almacenamiento local. Todo vive en este dispositivo (localStorage).
import { uid, todayISO } from './utils.js';

export const STORE_KEY = 'alacena:data:v1';

const empty = () => ({
  items: [],
  purchases: [],
  log: [],
  settings: { name: '', theme: 'auto' },
});

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      const base = empty();
      return {
        items: Array.isArray(d.items) ? d.items : [],
        purchases: Array.isArray(d.purchases) ? d.purchases : [],
        log: Array.isArray(d.log) ? d.log : [],
        settings: { ...base.settings, ...(d.settings || {}) },
      };
    }
  } catch (e) {
    console.warn('No se pudieron leer los datos', e);
  }
  return empty();
}

let data = load();

function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('No se pudieron guardar los datos', e);
  }
}

export const store = {
  get items() { return data.items; },
  get purchases() { return data.purchases; },
  get log() { return data.log; },
  get settings() { return data.settings; },

  reload() { data = load(); },

  addItems(items) {
    data.items.push(...items);
    save();
  },
  updateItem(id, patch) {
    const it = data.items.find((i) => i.id === id);
    if (it) {
      Object.assign(it, patch);
      save();
    }
    return it;
  },
  // reason: 'consumido' | 'tirado' | null (borrado sin registrar)
  removeItem(id, reason) {
    const index = data.items.findIndex((i) => i.id === id);
    if (index < 0) return null;
    const [item] = data.items.splice(index, 1);
    let entry = null;
    if (reason) {
      entry = { id: uid(), type: reason, name: item.name, emoji: item.emoji, date: todayISO() };
      data.log.push(entry);
    }
    save();
    return { item, index, entry };
  },
  restore({ item, index, entry }) {
    data.items.splice(Math.min(index, data.items.length), 0, item);
    if (entry) data.log = data.log.filter((e) => e.id !== entry.id);
    save();
  },

  addPurchase(p) {
    data.purchases.push(p);
    data.purchases.sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));
    save();
  },
  removePurchase(id) {
    data.purchases = data.purchases.filter((p) => p.id !== id);
    save();
  },

  setSettings(patch) {
    Object.assign(data.settings, patch);
    save();
  },

  exportJSON() {
    return JSON.stringify({ app: 'alacena', version: 1, exportedAt: new Date().toISOString(), ...data }, null, 2);
  },
  importJSON(text) {
    const d = JSON.parse(text);
    if (!d || !Array.isArray(d.items) || !Array.isArray(d.purchases)) throw new Error('El archivo no es un respaldo de Alacena');
    data = { items: d.items, purchases: d.purchases, log: Array.isArray(d.log) ? d.log : [], settings: { ...empty().settings, ...(d.settings || {}) } };
    save();
  },
  reset() {
    data = empty();
    save();
  },
};
