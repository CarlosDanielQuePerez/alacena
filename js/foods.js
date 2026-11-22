// Catálogo de alimentos: emoji, categoría, lugar sugerido y días aproximados
// que dura cada cosa según dónde se guarde. Son estimaciones caseras, no reglas.

export const LOCATIONS = {
  refri: { label: 'Refri', long: 'Refrigerador', emoji: '🧊', en: 'en el refri' },
  congelador: { label: 'Congelador', long: 'Congelador', emoji: '❄️', en: 'en el congelador' },
  alacena: { label: 'Alacena', long: 'Alacena', emoji: '🥫', en: 'en la alacena' },
};

export const CATEGORIES = {
  frutas: { label: 'Frutas', emoji: '🍎', days: { refri: 10, congelador: 240, alacena: 5 } },
  verduras: { label: 'Verduras', emoji: '🥬', days: { refri: 7, congelador: 240, alacena: 5 } },
  lacteos: { label: 'Lácteos y huevo', emoji: '🥛', days: { refri: 10, congelador: 90, alacena: 2 } },
  carnes: { label: 'Carnes y embutidos', emoji: '🥩', days: { refri: 3, congelador: 180, alacena: 1 } },
  pescados: { label: 'Pescados y mariscos', emoji: '🐟', days: { refri: 2, congelador: 150, alacena: 1 } },
  panaderia: { label: 'Pan y tortillas', emoji: '🍞', days: { refri: 7, congelador: 90, alacena: 4 } },
  bebidas: { label: 'Bebidas', emoji: '🧃', days: { refri: 14, congelador: 90, alacena: 180 } },
  despensa: { label: 'Despensa', emoji: '🥫', days: { refri: 30, congelador: 180, alacena: 365 } },
  congelados: { label: 'Congelados', emoji: '🧊', days: { refri: 3, congelador: 120, alacena: 1 } },
  preparados: { label: 'Comida preparada', emoji: '🍲', days: { refri: 3, congelador: 60, alacena: 1 } },
  otros: { label: 'Otros', emoji: '🛒', days: { refri: 7, congelador: 90, alacena: 60 } },
};

export const UNITS = [
  ['pz', 'pieza', 'piezas'],
  ['kg', 'kg', 'kg'],
  ['g', 'g', 'g'],
  ['L', 'litro', 'litros'],
  ['ml', 'ml', 'ml'],
  ['paquete', 'paquete', 'paquetes'],
  ['lata', 'lata', 'latas'],
  ['botella', 'botella', 'botellas'],
  ['bolsa', 'bolsa', 'bolsas'],
];
export const COUNTABLE = new Set(['pz', 'paquete', 'lata', 'botella', 'bolsa']);

// F(palabras clave, emoji, categoría, lugar sugerido, días refri, congelador, alacena)
// null = no se recomienda guardarlo ahí (se usa el valor de la categoría).
const F = (k, emoji, cat, loc, refri, congelador, alacena) => ({ k, emoji, cat, loc, days: { refri, congelador, alacena } });

// El orden importa: lo más específico primero.
export const FOODS = [
  F(['leche de almendra', 'leche de avena', 'leche de soya', 'leche de coco', 'bebida de almendra', 'bebida de avena'], '🥛', 'bebidas', 'refri', 7, 60, 180),
  F(['leche condensada', 'leche evaporada', 'lechera', 'media crema'], '🥫', 'despensa', 'alacena', 5, null, 365),
  F(['jugo', 'nectar', 'jumex', 'del valle', 'boing'], '🧃', 'bebidas', 'refri', 10, 90, 180),
  F(['papas fritas', 'sabritas', 'botana', 'doritos', 'cheetos', 'ruffles', 'takis', 'palomitas'], '🍿', 'despensa', 'alacena', 30, null, 90),
  F(['helado', 'nieve', 'paleta helada'], '🍨', 'congelados', 'congelador', 1, 60, null),
  F(['pizza', 'nuggets', 'congelad', 'hamburguesa'], '🍕', 'congelados', 'congelador', 3, 90, null),
  F(['leche', 'lala', 'alpura', 'deslactosada', 'santa clara', 'nutri leche'], '🥛', 'lacteos', 'refri', 7, 90, 2),
  F(['yogur', 'yogurt', 'yoghurt', 'danone', 'yoplait', 'activia', 'danonino', 'bonafont'], '🥣', 'lacteos', 'refri', 14, 60, null),
  F(['huevo', 'blanquillo', 'bachoco'], '🥚', 'lacteos', 'refri', 28, null, 14),
  F(['queso panela', 'queso fresco', 'panela', 'requeson', 'cottage', 'ricotta', 'queso crema', 'philadelphia'], '🧀', 'lacteos', 'refri', 7, 60, null),
  F(['queso', 'manchego', 'oaxaca', 'chihuahua', 'parmesano', 'gouda', 'cheddar', 'mozzarella', 'asadero'], '🧀', 'lacteos', 'refri', 21, 180, null),
  F(['mantequilla', 'margarina', 'gloria'], '🧈', 'lacteos', 'refri', 30, 180, null),
  F(['crema'], '🥛', 'lacteos', 'refri', 10, null, null),
  F(['caldo de pollo', 'consome', 'knorr', 'sopa instantanea', 'maruchan'], '🍜', 'despensa', 'alacena', 7, null, 365),
  F(['jamon', 'salchicha', 'tocino', 'chorizo', 'pepperoni', 'salami', 'pechuga de pavo', 'pavo', 'longaniza', 'mortadela', 'fud', 'san rafael'], '🥓', 'carnes', 'refri', 5, 60, null),
  F(['pollo', 'pechuga', 'muslo', 'pierna', 'alitas', 'milanesa de pollo'], '🍗', 'carnes', 'refri', 2, 270, null),
  F(['carne molida', 'molida'], '🥩', 'carnes', 'refri', 2, 120, null),
  F(['bistec', 'arrachera', 'chuleta', 'cerdo', 'puerco', 'costilla', 'res', 'carne', 'milanesa', 'filete de res', 'aguayon', 'suadero'], '🥩', 'carnes', 'refri', 3, 180, null),
  F(['atun', 'sardina'], '🐟', 'despensa', 'alacena', 3, null, 730),
  F(['salmon', 'pescado', 'tilapia', 'mojarra', 'filete de pescado', 'camaron', 'marisco', 'pulpo', 'surimi'], '🐟', 'pescados', 'refri', 2, 150, null),
  F(['tofu'], '🍱', 'preparados', 'refri', 5, 90, null),
  F(['hummus'], '🥙', 'preparados', 'refri', 7, null, null),
  F(['sobras', 'guisado', 'comida', 'tupper', 'lasana', 'pozole', 'caldo'], '🍲', 'preparados', 'refri', 3, 60, null),
  F(['lechuga', 'espinaca', 'acelga', 'arugula', 'kale', 'ensalada', 'berro'], '🥬', 'verduras', 'refri', 5, null, 1),
  F(['jitomate', 'tomate', 'saladet'], '🍅', 'verduras', 'refri', 10, 60, 5),
  F(['tomate verde', 'tomatillo'], '🍏', 'verduras', 'refri', 14, 90, 7),
  F(['aguacate'], '🥑', 'frutas', 'alacena', 5, 90, 4),
  F(['cebolla'], '🧅', 'verduras', 'alacena', 30, 180, 30),
  F(['ajo'], '🧄', 'verduras', 'alacena', 60, 180, 90),
  F(['papa', 'patata'], '🥔', 'verduras', 'alacena', 21, null, 30),
  F(['camote'], '🍠', 'verduras', 'alacena', 21, null, 21),
  F(['zanahoria'], '🥕', 'verduras', 'refri', 21, 240, 5),
  F(['brocoli', 'coliflor', 'col', 'repollo'], '🥦', 'verduras', 'refri', 5, 240, 2),
  F(['chile', 'jalapeno', 'serrano', 'poblano', 'pimiento', 'morron', 'habanero'], '🌶️', 'verduras', 'refri', 10, 180, 4),
  F(['pepino'], '🥒', 'verduras', 'refri', 7, null, 3),
  F(['calabaza', 'calabacita', 'zucchini', 'chayote'], '🥒', 'verduras', 'refri', 7, 180, 4),
  F(['ejote', 'chicharo', 'nopal'], '🫛', 'verduras', 'refri', 5, 240, 2),
  F(['elote', 'maiz'], '🌽', 'verduras', 'refri', 3, 240, 2),
  F(['champinon', 'hongo', 'seta'], '🍄', 'verduras', 'refri', 5, 180, 1),
  F(['cilantro', 'perejil', 'hierbabuena', 'epazote', 'albahaca'], '🌿', 'verduras', 'refri', 7, 90, 2),
  F(['limon', 'lima'], '🍋', 'frutas', 'refri', 21, 120, 10),
  F(['naranja', 'mandarina', 'toronja'], '🍊', 'frutas', 'refri', 21, null, 10),
  F(['manzana', 'pera'], '🍎', 'frutas', 'refri', 30, null, 7),
  F(['platano', 'banana'], '🍌', 'frutas', 'alacena', 7, 90, 5),
  F(['fresa', 'frambuesa', 'zarzamora', 'mora', 'arandano', 'berries'], '🍓', 'frutas', 'refri', 4, 240, 1),
  F(['uva'], '🍇', 'frutas', 'refri', 10, 240, 3),
  F(['sandia', 'melon'], '🍉', 'frutas', 'alacena', 5, 240, 10),
  F(['pina'], '🍍', 'frutas', 'alacena', 5, 240, 4),
  F(['mango'], '🥭', 'frutas', 'alacena', 7, 240, 5),
  F(['papaya', 'guayaba'], '🍈', 'frutas', 'alacena', 7, 240, 4),
  F(['kiwi'], '🥝', 'frutas', 'refri', 21, null, 7),
  F(['durazno', 'ciruela', 'nectarina', 'chabacano'], '🍑', 'frutas', 'alacena', 7, 240, 4),
  F(['cereza'], '🍒', 'frutas', 'refri', 7, 240, 2),
  F(['coco'], '🥥', 'frutas', 'alacena', 7, 180, 30),
  F(['tortilla', 'tostada'], '🫓', 'panaderia', 'refri', 10, 90, 3),
  F(['pan', 'bolillo', 'telera', 'bimbo', 'baguette', 'concha', 'pan dulce', 'cuernito', 'croissant', 'wonder', 'oroweat'], '🍞', 'panaderia', 'alacena', 10, 90, 5),
  F(['galleta', 'gamesa', 'marias', 'emperador'], '🍪', 'despensa', 'alacena', 60, null, 90),
  F(['cereal', 'avena', 'granola', 'zucaritas', 'corn flakes', 'kelloggs'], '🥣', 'despensa', 'alacena', 60, null, 180),
  F(['arroz'], '🍚', 'despensa', 'alacena', 120, null, 365),
  F(['frijol', 'lenteja', 'garbanzo', 'haba'], '🫘', 'despensa', 'alacena', 120, null, 365),
  F(['pasta', 'spaghetti', 'espagueti', 'macarron', 'fideo', 'codito', 'sopa de pasta', 'la moderna'], '🍝', 'despensa', 'alacena', 120, null, 365),
  F(['harina', 'maseca', 'azucar', 'piloncillo'], '🌾', 'despensa', 'alacena', 120, null, 365),
  F(['sal', 'pimienta', 'oregano', 'comino', 'canela', 'especia'], '🧂', 'despensa', 'alacena', 365, null, 730),
  F(['aceite', 'nutrioli', 'capullo', 'oliva', 'vinagre'], '🫒', 'despensa', 'alacena', 365, null, 365),
  F(['cafe', 'nescafe', 'cafe molido'], '☕', 'despensa', 'alacena', 60, 180, 180),
  F(['te', 'manzanilla', 'infusion'], '🍵', 'despensa', 'alacena', 60, null, 365),
  F(['mayonesa', 'mostaza', 'ketchup', 'catsup', 'aderezo', 'mccormick'], '🥫', 'despensa', 'refri', 60, null, 180),
  F(['salsa', 'valentina', 'chipotle', 'mole'], '🌶️', 'despensa', 'refri', 30, 90, 180),
  F(['mermelada', 'miel', 'cajeta', 'nutella', 'crema de cacahuate'], '🍯', 'despensa', 'alacena', 90, null, 365),
  F(['chocolate', 'dulce', 'gomita', 'caramelo', 'chocolates'], '🍫', 'despensa', 'alacena', 90, null, 180),
  F(['cacahuate', 'nuez', 'almendra', 'pistache', 'semilla'], '🥜', 'despensa', 'alacena', 120, 365, 120),
  F(['refresco', 'coca', 'pepsi', 'sprite', 'fanta', 'manzanita', 'sidral', 'squirt', 'jarritos'], '🥤', 'bebidas', 'alacena', 30, null, 180),
  F(['agua mineral', 'topo chico', 'penafiel'], '🫧', 'bebidas', 'alacena', 30, null, 365),
  F(['agua', 'ciel', 'epura', 'garrafon'], '💧', 'bebidas', 'alacena', 30, null, 365),
  F(['cerveza', 'corona', 'modelo', 'tecate', 'victoria', 'indio', 'xx lager'], '🍺', 'bebidas', 'alacena', 120, null, 180),
  F(['vino'], '🍷', 'bebidas', 'alacena', 5, null, 730),
];

export function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ñ/g, 'n');
}

const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Coincide con palabras completas (admite plurales). Las claves largas también
// coinciden como inicio de palabra para tolerar abreviaturas de los tickets.
const MATCHERS = FOODS.map((f) => ({
  food: f,
  re: f.k.map((k) => new RegExp(`(^|[^a-z])${escRe(k)}${k.length >= 5 ? '' : '(s|es)?(?![a-z])'}`)),
}));

export function guessFood(name) {
  const n = normalize(name).trim();
  if (n.length < 2) return null;
  for (const { food, re } of MATCHERS) {
    if (re.some((r) => r.test(n))) return food;
  }
  return null;
}

// Cosas del súper que no son comida: por defecto solo se guardan en la compra.
const NON_FOOD = /(^|[^a-z])(detergente|jabon|shampoo|champu|acondicionador|papel|servilleta|cloro|suavizante|pasta dental|cepillo|desodorante|toalla|panal|panales|bolsa de basura|bolsas de basura|fabuloso|pinol|esponja|foco|pila|pilas|veladora|insecticida|raid|aromatizante|limpiador|lavatrastes|salvo|axion|downy|ariel|roma|zote|kleenex|cotonete|rastrillo|gillette|crema corporal|crema dental|colgate|toallitas|encendedor|cerillos|aluminio|plastico adherente)(?![a-z])/;
export const isNonFood = (name) => NON_FOOD.test(normalize(name));

export function estimateDays(name, cat, loc) {
  const f = guessFood(name);
  if (f && f.days[loc] != null) return f.days[loc];
  return (CATEGORIES[cat] || CATEGORIES.otros).days[loc];
}

export function unitLabel(unit, qty) {
  const u = UNITS.find((x) => x[0] === unit);
  if (!u) return unit || '';
  if (unit === 'pz') return 'pz';
  return Number(qty) === 1 ? u[1] : u[2];
}
