// Catálogo de alimentos: ilustración, categoría, lugar sugerido y días aproximados
// que dura cada cosa según dónde se guarde. Son estimaciones caseras, no reglas.

export const LOCATIONS = {
  refri: { label: 'Refri', long: 'Refrigerador', icon: 'fridge', en: 'en el refri' },
  congelador: { label: 'Congelador', long: 'Congelador', icon: 'snow', en: 'en el congelador' },
  alacena: { label: 'Alacena', long: 'Alacena', icon: 'cabinet', en: 'en la alacena' },
};

export const CATEGORIES = {
  frutas: { label: 'Frutas', icon: 'apple', days: { refri: 10, congelador: 240, alacena: 5 } },
  verduras: { label: 'Verduras', icon: 'carrot', days: { refri: 7, congelador: 240, alacena: 5 } },
  lacteos: { label: 'Lácteos y huevo', icon: 'milk', days: { refri: 10, congelador: 90, alacena: 2 } },
  carnes: { label: 'Carnes y embutidos', icon: 'meat', days: { refri: 3, congelador: 180, alacena: 1 } },
  pescados: { label: 'Pescados y mariscos', icon: 'fish', days: { refri: 2, congelador: 150, alacena: 1 } },
  panaderia: { label: 'Pan y tortillas', icon: 'bread', days: { refri: 7, congelador: 90, alacena: 4 } },
  bebidas: { label: 'Bebidas', icon: 'soda', days: { refri: 14, congelador: 90, alacena: 180 } },
  despensa: { label: 'Despensa', icon: 'can', days: { refri: 30, congelador: 180, alacena: 365 } },
  congelados: { label: 'Congelados', icon: 'icecream', days: { refri: 3, congelador: 120, alacena: 1 } },
  preparados: { label: 'Comida preparada', icon: 'tupper', days: { refri: 3, congelador: 60, alacena: 1 } },
  otros: { label: 'Otros', icon: 'basket', days: { refri: 7, congelador: 90, alacena: 60 } },
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

// F(palabras clave, ilustración (js/icons.js), categoría, lugar sugerido, días refri, congelador, alacena)
// null = no se recomienda guardarlo ahí (se usa el valor de la categoría).
const F = (k, icon, cat, loc, refri, congelador, alacena) => ({ k, icon, cat, loc, days: { refri, congelador, alacena } });

// El orden importa: lo más específico primero.
export const FOODS = [
  F(['leche de almendra', 'leche de avena', 'leche de soya', 'leche de coco', 'bebida de almendra', 'bebida de avena'], 'milk', 'bebidas', 'refri', 7, 60, 180),
  F(['leche condensada', 'leche evaporada', 'lechera', 'media crema'], 'can', 'despensa', 'alacena', 5, null, 365),
  F(['jugo', 'nectar', 'jumex', 'del valle', 'boing'], 'juice', 'bebidas', 'refri', 10, 90, 180),
  F(['papas fritas', 'sabritas', 'botana', 'doritos', 'cheetos', 'ruffles', 'takis', 'palomitas'], 'chips', 'despensa', 'alacena', 30, null, 90),
  F(['helado', 'nieve', 'paleta helada'], 'icecream', 'congelados', 'congelador', 1, 60, null),
  F(['pizza', 'nuggets', 'congelad', 'hamburguesa'], 'pizza', 'congelados', 'congelador', 3, 90, null),
  F(['leche', 'lala', 'alpura', 'deslactosada', 'santa clara', 'nutri leche'], 'milk', 'lacteos', 'refri', 7, 90, 2),
  F(['yogur', 'yogurt', 'yoghurt', 'danone', 'yoplait', 'activia', 'danonino', 'bonafont'], 'yogurt', 'lacteos', 'refri', 14, 60, null),
  F(['huevo', 'blanquillo', 'bachoco'], 'egg', 'lacteos', 'refri', 28, null, 14),
  F(['queso panela', 'queso fresco', 'panela', 'requeson', 'cottage', 'ricotta', 'queso crema', 'philadelphia'], 'cheese', 'lacteos', 'refri', 7, 60, null),
  F(['queso', 'manchego', 'oaxaca', 'chihuahua', 'parmesano', 'gouda', 'cheddar', 'mozzarella', 'asadero'], 'cheese', 'lacteos', 'refri', 21, 180, null),
  F(['mantequilla', 'margarina', 'gloria'], 'butter', 'lacteos', 'refri', 30, 180, null),
  F(['crema'], 'yogurt', 'lacteos', 'refri', 10, null, null),
  F(['caldo de pollo', 'consome', 'knorr', 'sopa instantanea', 'maruchan'], 'bowl', 'despensa', 'alacena', 7, null, 365),
  F(['jamon', 'salchicha', 'tocino', 'chorizo', 'pepperoni', 'salami', 'pechuga de pavo', 'pavo', 'longaniza', 'mortadela', 'fud', 'san rafael'], 'sausage', 'carnes', 'refri', 5, 60, null),
  F(['pollo', 'pechuga', 'muslo', 'pierna', 'alitas', 'milanesa de pollo'], 'chicken', 'carnes', 'refri', 2, 270, null),
  F(['carne molida', 'molida'], 'meat', 'carnes', 'refri', 2, 120, null),
  F(['bistec', 'arrachera', 'chuleta', 'cerdo', 'puerco', 'costilla', 'res', 'carne', 'milanesa', 'filete de res', 'aguayon', 'suadero'], 'meat', 'carnes', 'refri', 3, 180, null),
  F(['atun', 'sardina'], 'can', 'despensa', 'alacena', 3, null, 730),
  F(['salmon', 'pescado', 'tilapia', 'mojarra', 'filete de pescado', 'camaron', 'marisco', 'pulpo', 'surimi'], 'fish', 'pescados', 'refri', 2, 150, null),
  F(['tofu'], 'tupper', 'preparados', 'refri', 5, 90, null),
  F(['hummus'], 'tupper', 'preparados', 'refri', 7, null, null),
  F(['sobras', 'guisado', 'comida', 'tupper', 'lasana', 'pozole', 'caldo'], 'tupper', 'preparados', 'refri', 3, 60, null),
  F(['lechuga', 'espinaca', 'acelga', 'arugula', 'kale', 'ensalada', 'berro'], 'lettuce', 'verduras', 'refri', 5, null, 1),
  F(['jitomate', 'tomate', 'saladet'], 'tomato', 'verduras', 'refri', 10, 60, 5),
  F(['tomate verde', 'tomatillo'], 'tomato', 'verduras', 'refri', 14, 90, 7),
  F(['aguacate'], 'avocado', 'frutas', 'alacena', 5, 90, 4),
  F(['cebolla'], 'onion', 'verduras', 'alacena', 30, 180, 30),
  F(['ajo'], 'garlic', 'verduras', 'alacena', 60, 180, 90),
  F(['papa', 'patata'], 'potato', 'verduras', 'alacena', 21, null, 30),
  F(['camote'], 'potato', 'verduras', 'alacena', 21, null, 21),
  F(['zanahoria'], 'carrot', 'verduras', 'refri', 21, 240, 5),
  F(['brocoli', 'coliflor', 'col', 'repollo'], 'broccoli', 'verduras', 'refri', 5, 240, 2),
  F(['chile', 'jalapeno', 'serrano', 'poblano', 'pimiento', 'morron', 'habanero'], 'chili', 'verduras', 'refri', 10, 180, 4),
  F(['pepino'], 'cucumber', 'verduras', 'refri', 7, null, 3),
  F(['calabaza', 'calabacita', 'zucchini', 'chayote'], 'cucumber', 'verduras', 'refri', 7, 180, 4),
  F(['ejote', 'chicharo', 'nopal'], 'cucumber', 'verduras', 'refri', 5, 240, 2),
  F(['elote', 'maiz'], 'corn', 'verduras', 'refri', 3, 240, 2),
  F(['champinon', 'hongo', 'seta'], 'mushroom', 'verduras', 'refri', 5, 180, 1),
  F(['cilantro', 'perejil', 'hierbabuena', 'epazote', 'albahaca'], 'herb', 'verduras', 'refri', 7, 90, 2),
  F(['limon', 'lima'], 'lemon', 'frutas', 'refri', 21, 120, 10),
  F(['naranja', 'mandarina', 'toronja'], 'orange', 'frutas', 'refri', 21, null, 10),
  F(['manzana', 'pera'], 'apple', 'frutas', 'refri', 30, null, 7),
  F(['platano', 'banana'], 'banana', 'frutas', 'alacena', 7, 90, 5),
  F(['fresa', 'frambuesa', 'zarzamora', 'mora', 'arandano', 'berries'], 'strawberry', 'frutas', 'refri', 4, 240, 1),
  F(['uva'], 'grapes', 'frutas', 'refri', 10, 240, 3),
  F(['sandia', 'melon'], 'watermelon', 'frutas', 'alacena', 5, 240, 10),
  F(['pina'], 'pineapple', 'frutas', 'alacena', 5, 240, 4),
  F(['mango'], 'peach', 'frutas', 'alacena', 7, 240, 5),
  F(['papaya', 'guayaba'], 'peach', 'frutas', 'alacena', 7, 240, 4),
  F(['kiwi'], 'peach', 'frutas', 'refri', 21, null, 7),
  F(['durazno', 'ciruela', 'nectarina', 'chabacano'], 'peach', 'frutas', 'alacena', 7, 240, 4),
  F(['cereza'], 'peach', 'frutas', 'refri', 7, 240, 2),
  F(['coco'], 'peach', 'frutas', 'alacena', 7, 180, 30),
  F(['tortilla', 'tostada'], 'tortilla', 'panaderia', 'refri', 10, 90, 3),
  F(['pan', 'bolillo', 'telera', 'bimbo', 'baguette', 'concha', 'pan dulce', 'cuernito', 'croissant', 'wonder', 'oroweat'], 'bread', 'panaderia', 'alacena', 10, 90, 5),
  F(['galleta', 'gamesa', 'marias', 'emperador'], 'cookie', 'despensa', 'alacena', 60, null, 90),
  F(['cereal', 'avena', 'granola', 'zucaritas', 'corn flakes', 'kelloggs'], 'bowl', 'despensa', 'alacena', 60, null, 180),
  F(['arroz'], 'sack', 'despensa', 'alacena', 120, null, 365),
  F(['frijol', 'lenteja', 'garbanzo', 'haba'], 'sack', 'despensa', 'alacena', 120, null, 365),
  F(['pasta', 'spaghetti', 'espagueti', 'macarron', 'fideo', 'codito', 'sopa de pasta', 'la moderna'], 'sack', 'despensa', 'alacena', 120, null, 365),
  F(['harina', 'maseca', 'azucar', 'piloncillo'], 'sack', 'despensa', 'alacena', 120, null, 365),
  F(['sal', 'pimienta', 'oregano', 'comino', 'canela', 'especia'], 'shaker', 'despensa', 'alacena', 365, null, 730),
  F(['aceite', 'nutrioli', 'capullo', 'oliva', 'vinagre'], 'oil', 'despensa', 'alacena', 365, null, 365),
  F(['cafe', 'nescafe', 'cafe molido'], 'mug', 'despensa', 'alacena', 60, 180, 180),
  F(['te', 'manzanilla', 'infusion'], 'mug', 'despensa', 'alacena', 60, null, 365),
  F(['mayonesa', 'mostaza', 'ketchup', 'catsup', 'aderezo', 'mccormick'], 'squeeze', 'despensa', 'refri', 60, null, 180),
  F(['salsa', 'valentina', 'chipotle', 'mole'], 'squeeze', 'despensa', 'refri', 30, 90, 180),
  F(['mermelada', 'miel', 'cajeta', 'nutella', 'crema de cacahuate'], 'honey', 'despensa', 'alacena', 90, null, 365),
  F(['chocolate', 'dulce', 'gomita', 'caramelo', 'chocolates'], 'candy', 'despensa', 'alacena', 90, null, 180),
  F(['cacahuate', 'nuez', 'almendra', 'pistache', 'semilla'], 'peanut', 'despensa', 'alacena', 120, 365, 120),
  F(['refresco', 'coca', 'pepsi', 'sprite', 'fanta', 'manzanita', 'sidral', 'squirt', 'jarritos'], 'soda', 'bebidas', 'alacena', 30, null, 180),
  F(['agua mineral', 'topo chico', 'penafiel'], 'water', 'bebidas', 'alacena', 30, null, 365),
  F(['agua', 'ciel', 'epura', 'garrafon'], 'water', 'bebidas', 'alacena', 30, null, 365),
  F(['cerveza', 'corona', 'modelo', 'tecate', 'victoria', 'indio', 'xx lager'], 'beer', 'bebidas', 'alacena', 120, null, 180),
  F(['vino'], 'wine', 'bebidas', 'alacena', 5, null, 730),
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

// Ilustración de un producto: la guardada, la que se adivina por el nombre o la de su categoría.
export function iconFor(x) {
  return (x && x.icon) || guessFood(x?.name)?.icon || CATEGORIES[x?.cat]?.icon || 'basket';
}
