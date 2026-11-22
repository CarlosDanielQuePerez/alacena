# 🫙 Alacena

**Tu cocina, siempre a la mano.** Alacena es una app web pensada para el celular donde guardas tus compras (escaneando el ticket o a mano) y siempre sabes qué hay en tu refri, congelador y alacena, y más o menos cuándo vence cada cosa.

## Qué puede hacer

- **Escanear tickets** 🧾: tomas foto al ticket y la app lee productos, precios, tienda, fecha y total (OCR en español con [Tesseract.js](https://github.com/naptha/tesseract.js)). Antes de guardar puedes revisar y corregir todo.
- **Agregar a mano** ✍️: escribes el producto y la app adivina el emoji, la categoría, dónde se guarda y cuánto suele durar.
- **Fechas exactas o aproximadas** 📅: si tienes la fecha del empaque, la pones. Si no, la app la calcula según el alimento y el lugar (por ejemplo, el pollo dura ~2 días en el refri y ~9 meses en el congelador).
- **Mi cocina** 🧊: inventario con buscador, filtros por lugar y orden por lo que vence primero (vencidos, úsalos pronto, esta semana, con calma).
- **Acciones rápidas**: "Usé una pieza", "Se terminó", "Se echó a perder" (con deshacer) y mover entre refri, congelador y alacena (la fecha se recalcula).
- **Historial de compras** 🧺: lo que gastaste en el mes y el detalle de cada compra.
- **Detecta lo que no es comida** (jabón, papel…), que se queda solo en la compra y no en tu inventario.
- **Funciona sin internet** y **se puede instalar** como app (PWA). Tiene tema claro y oscuro.
- **Privacidad**: todo se guarda solo en tu dispositivo. Desde *Ajustes* puedes hacer un respaldo y restaurarlo en otro teléfono.

## Cómo correrla

No necesita instalar nada ni compilar: es HTML, CSS y JavaScript puro (módulos ES). Solo hace falta servir la carpeta por HTTP:

```bash
python -m http.server 5173
# o bien
npx serve .
```

Luego abre <http://localhost:5173>. Para probarla en tu celular, conéctalo a la misma red Wi‑Fi y abre `http://IP-DE-TU-COMPU:5173`. Ojo: la cámara y la instalación como app necesitan **HTTPS** cuando no es `localhost`, así que para el teléfono lo más fácil es publicarla en GitHub Pages.

### Publicar en GitHub Pages

1. En GitHub ve a **Settings → Pages**.
2. En *Source* elige **Deploy from a branch**, rama `main` y carpeta `/ (root)`.
3. En un par de minutos estará en `https://<tu-usuario>.github.io/alacena/`.

## Estructura

```
index.html            Estructura de la app y barra de navegación
css/styles.css        Estilos (paleta cálida, modo claro/oscuro, mobile-first)
js/app.js             Pantallas, navegación y lógica de la interfaz
js/store.js           Guardado local de productos, compras y ajustes
js/foods.js           Catálogo de alimentos: emoji, categoría y días que duran
js/ticket.js          Lectura del ticket (OCR) e interpretación del texto
js/utils.js           Fechas, formato de dinero y textos
sw.js                 Service worker para funcionar sin conexión
manifest.webmanifest  Datos para instalar la app
icons/                Íconos (generados con scripts/make-icons.mjs)
```

## Ideas para seguir

- Notificaciones cuando algo esté por vencer.
- Lista del súper a partir de lo que se terminó.
- Recetas sugeridas con lo que está por vencer.
- Sincronizar entre dispositivos (cuenta en la nube).

> Las fechas aproximadas son una guía casera; confía también en tu olfato. 👃
