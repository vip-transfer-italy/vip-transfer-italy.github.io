// Rarity tiers: weight = relative drop weight of the whole tier inside a case
const RARITIES = {
  common:    { name: 'Ширпотреб',   color: '#b0c3d9', weight: 0   },
  milspec:   { name: 'Армейское',   color: '#4b69ff', weight: 79.92 },
  restricted:{ name: 'Запрещённое', color: '#8847ff', weight: 15.98 },
  classified:{ name: 'Засекреченное', color: '#d32ce6', weight: 3.2 },
  covert:    { name: 'Тайное',      color: '#eb4b4b', weight: 0.64 },
  gold:      { name: 'Редкое ★',    color: '#e4ae39', weight: 0.26 },
};

const WEARS = [
  { id: 'FN', name: 'Прямо с завода', mult: 1.35, w: 8 },
  { id: 'MW', name: 'Немного поношенное', mult: 1.1, w: 22 },
  { id: 'FT', name: 'После полевых', mult: 1, w: 40 },
  { id: 'WW', name: 'Поношенное', mult: 0.85, w: 15 },
  { id: 'BS', name: 'Закалённое в боях', mult: 0.75, w: 15 },
];

// type → icon silhouette; p = base price in coins (FT)
const SKINS = [
  // rifles
  { id: 'ak_neon',    w: 'AK-47',    n: 'Неоновая гроза', t: 'rifle',  r: 'covert',     p: 5400, c: ['#ff2e63', '#08d9d6'] },
  { id: 'ak_jungle',  w: 'AK-47',    n: 'Джунгли',        t: 'rifle',  r: 'restricted', p: 420,  c: ['#3a7d44', '#9dc08b'] },
  { id: 'ak_ember',   w: 'AK-47',    n: 'Тлеющий уголь',  t: 'rifle',  r: 'classified', p: 1650, c: ['#ff6b35', '#2b2d42'] },
  { id: 'ak_slate',   w: 'AK-47',    n: 'Сланец',         t: 'rifle',  r: 'milspec',    p: 95,   c: ['#5c677d', '#979dac'] },
  { id: 'm4_cyber',   w: 'M4A4',     n: 'Киберпульс',     t: 'rifle',  r: 'covert',     p: 4700, c: ['#7209b7', '#4cc9f0'] },
  { id: 'm4_desert',  w: 'M4A4',     n: 'Пустынный шторм', t: 'rifle', r: 'milspec',    p: 70,   c: ['#c9a227', '#7f5539'] },
  { id: 'm4s_wave',   w: 'M4A1-S',   n: 'Волна',          t: 'rifle',  r: 'classified', p: 1380, c: ['#0077b6', '#90e0ef'] },
  { id: 'm4s_moss',   w: 'M4A1-S',   n: 'Мох',            t: 'rifle',  r: 'restricted', p: 310,  c: ['#606c38', '#dda15e'] },
  { id: 'famas_dot',  w: 'FAMAS',    n: 'Пиксель',        t: 'rifle',  r: 'milspec',    p: 38,   c: ['#ffbe0b', '#3a86ff'] },
  { id: 'galil_rust', w: 'Galil AR', n: 'Ржавчина',       t: 'rifle',  r: 'milspec',    p: 32,   c: ['#9c6644', '#e6ccb2'] },
  { id: 'aug_frost',  w: 'AUG',      n: 'Иней',           t: 'rifle',  r: 'restricted', p: 260,  c: ['#a8dadc', '#457b9d'] },
  { id: 'sg_venom',   w: 'SG 553',   n: 'Яд',             t: 'rifle',  r: 'milspec',    p: 45,   c: ['#80ed99', '#22577a'] },
  // snipers
  { id: 'awp_dragon', w: 'AWP',      n: 'Золотой змей',   t: 'sniper', r: 'covert',     p: 9800, c: ['#ffd60a', '#9d0208'] },
  { id: 'awp_storm',  w: 'AWP',      n: 'Гроза',          t: 'sniper', r: 'classified', p: 2100, c: ['#3c096c', '#ff9e00'] },
  { id: 'awp_safari', w: 'AWP',      n: 'Сафари',         t: 'sniper', r: 'restricted', p: 520,  c: ['#bc6c25', '#fefae0'] },
  { id: 'ssg_azure',  w: 'SSG 08',   n: 'Лазурь',         t: 'sniper', r: 'milspec',    p: 55,   c: ['#00b4d8', '#03045e'] },
  { id: 'scar_blood', w: 'SCAR-20',  n: 'Кровавый след',  t: 'sniper', r: 'restricted', p: 180,  c: ['#c1121f', '#1d1d1d'] },
  // pistols
  { id: 'deagle_sun', w: 'Desert Eagle', n: 'Солнцепёк',  t: 'pistol', r: 'classified', p: 980,  c: ['#ffb703', '#fb8500'] },
  { id: 'deagle_ink', w: 'Desert Eagle', n: 'Чернила',    t: 'pistol', r: 'restricted', p: 240,  c: ['#14213d', '#e5e5e5'] },
  { id: 'usp_ghost',  w: 'USP-S',    n: 'Призрак',        t: 'pistol', r: 'covert',     p: 3200, c: ['#f8f9fa', '#6c757d'] },
  { id: 'usp_coral',  w: 'USP-S',    n: 'Коралл',         t: 'pistol', r: 'restricted', p: 210,  c: ['#ff6f61', '#ffd6a5'] },
  { id: 'glock_fade', w: 'Glock-18', n: 'Градиент',       t: 'pistol', r: 'classified', p: 1150, c: ['#ff4ecd', '#ffd23f'] },
  { id: 'glock_grid', w: 'Glock-18', n: 'Сетка',          t: 'pistol', r: 'milspec',    p: 28,   c: ['#2b2d42', '#8d99ae'] },
  { id: 'p250_mint',  w: 'P250',     n: 'Мята',           t: 'pistol', r: 'milspec',    p: 22,   c: ['#b7e4c7', '#2d6a4f'] },
  { id: 'five_lava',  w: 'Five-SeveN', n: 'Лава',         t: 'pistol', r: 'restricted', p: 160,  c: ['#d00000', '#ffba08'] },
  { id: 'tec_toxic',  w: 'Tec-9',    n: 'Токсин',         t: 'pistol', r: 'milspec',    p: 18,   c: ['#aacc00', '#283618'] },
  // smg / shotgun
  { id: 'mp9_hive',   w: 'MP9',      n: 'Улей',           t: 'smg',    r: 'milspec',    p: 26,   c: ['#ffc300', '#000814'] },
  { id: 'mac_candy',  w: 'MAC-10',   n: 'Леденец',        t: 'smg',    r: 'restricted', p: 140,  c: ['#ff70a6', '#70d6ff'] },
  { id: 'p90_circuit',w: 'P90',      n: 'Микросхема',     t: 'smg',    r: 'classified', p: 760,  c: ['#06d6a0', '#073b4c'] },
  { id: 'ump_ash',    w: 'UMP-45',   n: 'Пепел',          t: 'smg',    r: 'milspec',    p: 20,   c: ['#adb5bd', '#343a40'] },
  { id: 'mp7_ocean',  w: 'MP7',      n: 'Океан',          t: 'smg',    r: 'milspec',    p: 24,   c: ['#0096c7', '#caf0f8'] },
  { id: 'nova_tiger', w: 'Nova',     n: 'Тигр',           t: 'shotgun',r: 'milspec',    p: 16,   c: ['#f77f00', '#003049'] },
  { id: 'xm_plasma',  w: 'XM1014',   n: 'Плазма',         t: 'shotgun',r: 'restricted', p: 120,  c: ['#9b5de5', '#00f5d4'] },
  // knives & gloves
  { id: 'k_karam_fade', w: '★ Керамбит', n: 'Градиент',   t: 'knife',  r: 'gold', p: 42000, c: ['#ff4ecd', '#ffd23f'] },
  { id: 'k_butter_sap', w: '★ Бабочка',  n: 'Сапфир',     t: 'knife',  r: 'gold', p: 65000, c: ['#0353a4', '#00b4d8'] },
  { id: 'k_bayo_night', w: '★ Штык-нож', n: 'Ночь',       t: 'knife',  r: 'gold', p: 18000, c: ['#1b263b', '#778da9'] },
  { id: 'k_flip_tiger', w: '★ Складной', n: 'Тигриный зуб', t: 'knife', r: 'gold', p: 12500, c: ['#ffb703', '#bc6c25'] },
  { id: 'k_gut_rust',   w: '★ Нож с лезвием-крюком', n: 'Ржавчина', t: 'knife', r: 'gold', p: 6200, c: ['#9c6644', '#e6ccb2'] },
  { id: 'g_sport_neon', w: '★ Спорт. перчатки', n: 'Неон', t: 'gloves', r: 'gold', p: 38000, c: ['#80ff72', '#7ee8fa'] },
  { id: 'g_driver_crim',w: '★ Водит. перчатки', n: 'Багрянец', t: 'gloves', r: 'gold', p: 21000, c: ['#9d0208', '#370617'] },
];

const SKIN = Object.fromEntries(SKINS.map(s => [s.id, s]));

const CASES = [
  { id: 'starter', name: 'Новичок',   price: 119,  hue: '#4b69ff', tag: 'Дёшево',
    items: ['glock_grid','p250_mint','tec_toxic','ump_ash','mp9_hive','nova_tiger','mp7_ocean','famas_dot','five_lava','mac_candy','xm_plasma','p90_circuit','glock_fade','usp_ghost','k_gut_rust'] },
  { id: 'pistol',  name: 'Пистолетный', price: 149,hue: '#8847ff',
    items: ['glock_grid','p250_mint','tec_toxic','five_lava','usp_coral','deagle_ink','deagle_sun','glock_fade','usp_ghost','k_flip_tiger'] },
  { id: 'rifle',   name: 'Штурмовой',  price: 249,  hue: '#d32ce6', tag: 'Хит',
    items: ['famas_dot','galil_rust','sg_venom','ak_slate','m4_desert','aug_frost','m4s_moss','ak_jungle','m4s_wave','ak_ember','ak_neon','m4_cyber','k_bayo_night','g_driver_crim'] },
  { id: 'sniper',  name: 'Снайпер',    price: 289,  hue: '#eb4b4b',
    items: ['ssg_azure','sg_venom','ak_slate','scar_blood','awp_safari','aug_frost','awp_storm','m4s_wave','awp_dragon','k_flip_tiger','k_bayo_night'] },
  { id: 'neon',    name: 'Неон',       price: 1090, hue: '#08d9d6', tag: 'Новый',
    items: ['mac_candy','xm_plasma','aug_frost','usp_coral','five_lava','p90_circuit','glock_fade','m4s_wave','ak_neon','m4_cyber','g_sport_neon','k_karam_fade'] },
  { id: 'gold',    name: 'Золото',     price: 4990, hue: '#e4ae39', tag: 'Премиум',
    items: ['ak_ember','awp_storm','deagle_sun','m4s_wave','glock_fade','p90_circuit','ak_neon','awp_dragon','usp_ghost','m4_cyber','k_butter_sap','k_karam_fade','g_sport_neon','g_driver_crim'] },
];
