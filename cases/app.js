(() => {
'use strict';

/* ---------- storage & state ---------- */
const KEY = 'dropzone_v1';
const store = {
  get() { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { return null; } },
  set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} },
};
const state = Object.assign({
  balance: 1000, inv: [], bonusAt: 0, fast: false,
  stats: { opened: 0, upgrades: 0, upWins: 0, best: null },
}, store.get() || {});
const save = () => { store.set(state); renderHeader(); };

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const app = $('#app');
const fmt = n => Math.round(n).toLocaleString('ru-RU');
const uid = () => Math.random().toString(36).slice(2, 10);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- icons ---------- */
const SHAPES = {
  rifle:  'M10 40 L40 31 L60 31 L62 27 L140 27 L140 22 L150 22 L150 27 L190 27 L190 33 L140 33 L135 37 L110 37 L104 62 L92 60 L96 37 L80 37 L76 51 L64 51 L60 39 L42 45 L14 54 Z',
  sniper: 'M6 42 L40 33 L60 33 L60 29 L196 29 L196 34 L120 34 L116 39 L90 39 L84 54 L72 54 L70 41 L44 47 L10 56 Z M66 17 L122 17 Q126 22 122 26 L66 26 Q62 22 66 17 Z',
  pistol: 'M55 22 L150 22 L150 37 L102 37 L98 42 L88 42 L82 66 L62 66 L70 37 L55 34 Z',
  smg:    'M28 36 L50 29 L150 29 L150 23 L156 23 L156 29 L174 29 L174 35 L130 35 L126 39 L112 39 L108 64 L97 64 L100 39 L80 39 L78 48 L66 48 L62 39 L34 46 Z',
  shotgun:'M8 42 L46 33 L182 31 L192 31 L192 37 L120 37 L120 42 L80 42 L76 48 L64 48 L60 42 L46 46 L12 54 Z',
  knife:  'M18 43 L78 41 L84 35 L92 35 L92 40 Q150 28 188 39 Q150 54 92 51 L92 56 L84 56 L78 50 L18 50 Q11 46.5 18 43 Z',
  gloves: 'M76 72 L76 42 Q72 34 78 31 L80 18 Q85 12 90 18 L90 30 L96 30 L96 12 Q101 6 106 12 L106 30 L111 30 L111 15 Q116 9 121 15 L121 32 L125 32 L126 22 Q131 17 135 23 L134 52 Q132 66 122 72 Z M72 72 L128 72 L128 78 L72 78 Z',
};
function icon(s) {
  const g = 'g' + s.id;
  return `<svg class="ico" viewBox="0 0 200 84" aria-hidden="true"><defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${s.c[0]}"/><stop offset="1" stop-color="${s.c[1]}"/></linearGradient></defs><path d="${SHAPES[s.t]}" fill="url(#${g})" stroke="rgba(0,0,0,.55)" stroke-width="1.5"/></svg>`;
}
function caseArt(c) {
  return `<svg class="case-art" viewBox="0 0 120 90" aria-hidden="true"><defs><linearGradient id="cg${c.id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.hue}"/><stop offset="1" stop-color="#11131c"/></linearGradient></defs>
  <rect x="8" y="22" width="104" height="60" rx="8" fill="url(#cg${c.id})" stroke="${c.hue}" stroke-width="2"/>
  <rect x="8" y="22" width="104" height="18" rx="8" fill="rgba(255,255,255,.12)"/>
  <rect x="48" y="34" width="24" height="14" rx="3" fill="#11131c" stroke="${c.hue}" stroke-width="2"/>
  <path d="M42 22 Q42 8 60 8 Q78 8 78 22" fill="none" stroke="${c.hue}" stroke-width="4"/></svg>`;
}

/* ---------- item helpers ---------- */
function pickWeighted(list, wfn) {
  const total = list.reduce((a, x) => a + wfn(x), 0);
  let r = Math.random() * total;
  for (const x of list) { r -= wfn(x); if (r <= 0) return x; }
  return list[list.length - 1];
}
function caseWeights(c) {
  const byR = {};
  c.items.forEach(id => { const r = SKIN[id].r; byR[r] = (byR[r] || 0) + 1; });
  return c.items.map(id => ({ id, w: RARITIES[SKIN[id].r].weight / byR[SKIN[id].r] }));
}
function makeItem(skinId, wear) {
  const s = SKIN[skinId];
  wear = wear || pickWeighted(WEARS, x => x.w);
  return { uid: uid(), id: skinId, wear: wear.id, price: Math.max(1, Math.round(s.p * wear.mult)) };
}
const wearName = id => WEARS.find(w => w.id === id).name;
function rollCase(c) {
  const id = pickWeighted(caseWeights(c), x => x.w).id;
  return makeItem(id);
}

function card(item, extra = '', after = '') {
  const s = SKIN[item.id || item];
  const r = RARITIES[s.r];
  const price = item.price != null ? item.price : s.p;
  return `<div class="item ${extra}" style="--rc:${r.color}" data-uid="${item.uid || ''}" data-id="${s.id}">
    ${icon(s)}
    <div class="item-w">${esc(s.w)}${item.wear ? ` <small>${item.wear}</small>` : ''}</div>
    <div class="item-n">${esc(s.n)}</div>
    <div class="item-p"><span class="coin"></span>${fmt(price)}</div>${after}
  </div>`;
}

/* ---------- header / toast / modal ---------- */
function renderHeader() {
  $('#balance').textContent = fmt(state.balance);
  $('#invCount').textContent = state.inv.length;
  const left = state.bonusAt - Date.now();
  const b = $('#bonusBtn');
  if (left > 0) {
    const m = Math.floor(left / 60000), s = Math.floor(left / 1000) % 60;
    b.textContent = `${m}:${String(s).padStart(2, '0')}`; b.disabled = true;
  } else { b.textContent = '+ Бонус'; b.disabled = false; }
  const st = state.stats;
  $('#stats').innerHTML = `Открыто кейсов: <b>${st.opened}</b> · Апгрейдов: <b>${st.upgrades}</b> (успешных ${st.upWins})` +
    (st.best ? ` · Лучший дроп: <b style="color:${RARITIES[SKIN[st.best.id].r].color}">${esc(SKIN[st.best.id].w)} | ${esc(SKIN[st.best.id].n)}</b>` : '');
}
setInterval(renderHeader, 1000);
$('#bonusBtn').onclick = () => {
  if (state.bonusAt > Date.now()) return;
  const amt = 300 + Math.floor(Math.random() * 5) * 100;
  state.balance += amt; state.bonusAt = Date.now() + 5 * 60 * 1000;
  save(); toast(`+${fmt(amt)} монет бонуса`);
};
let toastT;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200);
}
function modal(html) {
  $('#modalBox').innerHTML = html; $('#modal').hidden = false;
}
function closeModal() { $('#modal').hidden = true; }
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal' || e.target.closest('[data-close]')) closeModal(); });

function addDrop(item, src) {
  state.inv.unshift(item);
  if (!state.stats.best || item.price > state.stats.best.price) state.stats.best = { id: item.id, price: item.price };
  pushLive(item, 'Вы', src);
}

/* ---------- live feed ---------- */
const NICKS = ['s1mpleFan', 'headshot', 'NoScope', 'kirill_228', 'Ghost', 'xXsniperXx', 'Lera', 'b1tcoin', 'Mr.Clutch', 'TapTap', 'Rush_B', 'zeus', 'Dimon', 'Smoke', 'frag0', 'Nina', 'ecoround'];
function pushLive(item, nick, src) {
  const s = SKIN[item.id];
  const el = document.createElement('div');
  el.className = 'live-item'; el.style.setProperty('--rc', RARITIES[s.r].color);
  el.title = `${nick} · ${src}`;
  el.innerHTML = `${icon(s)}<div><b>${esc(s.w)}</b><span>${esc(s.n)}</span><em>${esc(nick)}</em></div>`;
  const tr = $('#liveTrack'); tr.prepend(el);
  while (tr.children.length > 30) tr.lastChild.remove();
}
function fakeLive() {
  const c = CASES[Math.floor(Math.random() * CASES.length)];
  let it = rollCase(c);
  if (Math.random() < 0.25) { // spice up the feed a bit
    const rare = c.items.filter(id => ['covert', 'gold', 'classified'].includes(SKIN[id].r));
    it = makeItem(rare[Math.floor(Math.random() * rare.length)]);
  }
  pushLive(it, NICKS[Math.floor(Math.random() * NICKS.length)], c.name);
  setTimeout(fakeLive, 1500 + Math.random() * 3000);
}
for (let i = 0; i < 12; i++) { const c = CASES[i % CASES.length]; pushLive(rollCase(c), NICKS[i % NICKS.length], c.name); }
setTimeout(fakeLive, 2000);

/* ---------- pages ---------- */
function pageHome() {
  app.innerHTML = `
  <section class="hero">
    <div>
      <h1>Открывай кейсы. Апгрейдь. Собирай.</h1>
      <p>Стартовый баланс — 1000 монет, бесплатный бонус каждые 5 минут. Все шансы честно показаны внутри кейса.</p>
    </div>
  </section>
  <h2 class="sec">Кейсы</h2>
  <div class="cases">${CASES.map(c => `
    <a class="case" href="#/case/${c.id}" style="--ch:${c.hue}">
      ${c.tag ? `<span class="tag">${c.tag}</span>` : ''}
      ${caseArt(c)}
      <div class="case-name">${c.name}</div>
      <div class="case-price"><span class="coin"></span>${fmt(c.price)}</div>
    </a>`).join('')}
  </div>`;
}

let busy = false;
function pageCase(id) {
  const c = CASES.find(x => x.id === id);
  if (!c) return pageHome();
  const weights = caseWeights(c);
  const total = weights.reduce((a, x) => a + x.w, 0);
  const sorted = [...c.items].sort((a, b) => SKIN[b].p - SKIN[a].p);
  let qty = 1;
  app.innerHTML = `
  <a class="back" href="#/">← Все кейсы</a>
  <section class="case-head" style="--ch:${c.hue}">
    ${caseArt(c)}
    <h1>Кейс «${c.name}»</h1>
    <div class="rolls" id="rolls"></div>
    <div class="open-bar">
      <div class="qty">${[1, 2, 3, 4, 5].map(n => `<button data-q="${n}" class="${n === 1 ? 'on' : ''}">x${n}</button>`).join('')}</div>
      <button class="btn big" id="openBtn">Открыть за <span class="coin"></span><b id="openPrice">${fmt(c.price)}</b></button>
      <label class="fast"><input type="checkbox" id="fast" ${state.fast ? 'checked' : ''}> Быстро</label>
    </div>
  </section>
  <h2 class="sec">Содержимое кейса</h2>
  <div class="grid">${sorted.map(sid => {
    const w = weights.find(x => x.id === sid).w;
    return card(sid, 'static', `<div class="chance">${(w / total * 100).toFixed(w / total < 0.01 ? 2 : 1)}%</div>`);
  }).join('')}</div>`;

  const rolls = $('#rolls');
  const drawIdle = () => {
    rolls.innerHTML = Array.from({ length: qty }, () => `<div class="roll"><div class="strip">${
      Array.from({ length: 12 }, () => card(pickWeighted(weights, x => x.w).id, 'mini')).join('')}</div><i class="marker"></i></div>`).join('');
    rolls.className = 'rolls q' + qty;
  };
  drawIdle();
  $$('.qty button').forEach(b => b.onclick = () => {
    if (busy) return;
    qty = +b.dataset.q; $$('.qty button').forEach(x => x.classList.toggle('on', x === b));
    $('#openPrice').textContent = fmt(c.price * qty); drawIdle();
  });
  $('#fast').onchange = e => { state.fast = e.target.checked; save(); };
  $('#openBtn').onclick = () => openCase(c, qty, weights, rolls);
}

function openCase(c, qty, weights, rolls) {
  if (busy) return;
  const cost = c.price * qty;
  if (state.balance < cost) return toast('Недостаточно монет — заберите бонус');
  busy = true; $('#openBtn').disabled = true;
  state.balance -= cost; state.stats.opened += qty; save();

  const WIN = 45, N = 52;
  const wins = Array.from({ length: qty }, () => rollCase(c));
  rolls.innerHTML = wins.map(win => {
    const strip = Array.from({ length: N }, (_, i) => i === WIN ? card(win, 'mini') : card(pickWeighted(weights, x => x.w).id, 'mini'));
    return `<div class="roll"><div class="strip">${strip.join('')}</div><i class="marker"></i></div>`;
  }).join('');
  const dur = state.fast ? 1500 : 6500;
  requestAnimationFrame(() => {
    $$('.roll', rolls).forEach(roll => {
      const strip = $('.strip', roll);
      const it = strip.children[WIN];
      const center = roll.clientWidth / 2;
      const offset = it.offsetLeft + it.offsetWidth * (0.12 + Math.random() * 0.76) - center;
      strip.style.transition = `transform ${dur}ms cubic-bezier(.08,.6,.12,1)`;
      strip.style.transform = `translateX(${-offset}px)`;
    });
  });
  setTimeout(() => {
    $$('.roll', rolls).forEach(r => r.querySelector('.strip').children[WIN].classList.add('won'));
    wins.forEach(w => addDrop(w, c.name)); save();
    showWins(wins);
    busy = false; const b = $('#openBtn'); if (b) b.disabled = false;
  }, dur + 250);
}

function showWins(wins) {
  const sum = wins.reduce((a, w) => a + w.price, 0);
  modal(`<h2>Ваш дроп</h2>
    <div class="win-grid">${wins.map(w => card(w, 'big')).join('')}</div>
    <p class="muted">${wins.map(w => wearName(w.wear)).join(' · ')}</p>
    <div class="modal-actions">
      <button class="btn ghost" data-close>В инвентарь</button>
      <button class="btn" id="sellWins">Продать за <span class="coin"></span>${fmt(sum)}</button>
    </div>`);
  $('#sellWins').onclick = () => { sell(wins.map(w => w.uid)); closeModal(); };
}

function sell(uids) {
  let sum = 0;
  state.inv = state.inv.filter(it => { if (uids.includes(it.uid)) { sum += it.price; return false; } return true; });
  state.balance += sum; save();
  if (sum) toast(`Продано на ${fmt(sum)} монет`);
}

/* ---------- inventory ---------- */
function pageInventory() {
  const total = state.inv.reduce((a, x) => a + x.price, 0);
  app.innerHTML = `
  <div class="inv-head">
    <h1>Инвентарь <small>${state.inv.length} шт. · <span class="coin"></span>${fmt(total)}</small></h1>
    <div class="inv-actions">
      <select id="sort"><option value="new">Новые</option><option value="exp">Дорогие</option><option value="cheap">Дешёвые</option></select>
      <button class="btn ghost" id="sellSel" disabled>Продать выбранное</button>
      <button class="btn" id="sellAll" ${state.inv.length ? '' : 'disabled'}>Продать всё</button>
    </div>
  </div>
  <div class="grid" id="invGrid"></div>`;
  const sel = new Set();
  const draw = () => {
    const v = $('#sort').value;
    const list = [...state.inv];
    if (v === 'exp') list.sort((a, b) => b.price - a.price);
    if (v === 'cheap') list.sort((a, b) => a.price - b.price);
    $('#invGrid').innerHTML = list.length ? list.map(it => card(it, 'pick' + (sel.has(it.uid) ? ' sel' : ''))).join('')
      : `<div class="empty">Пусто. <a href="#/">Откройте кейс</a>, чтобы получить первые скины.</div>`;
    const s = state.inv.filter(i => sel.has(i.uid)).reduce((a, x) => a + x.price, 0);
    const b = $('#sellSel'); b.disabled = !sel.size; b.innerHTML = sel.size ? `Продать ${sel.size} за <span class="coin"></span>${fmt(s)}` : 'Продать выбранное';
  };
  $('#sort').onchange = draw;
  $('#invGrid').onclick = e => {
    const el = e.target.closest('.item'); if (!el) return;
    const u = el.dataset.uid; sel.has(u) ? sel.delete(u) : sel.add(u); draw();
  };
  $('#sellSel').onclick = () => { sell([...sel]); pageInventory(); };
  $('#sellAll').onclick = () => {
    modal(`<h2>Продать всё?</h2><p>${state.inv.length} предметов за <span class="coin"></span><b>${fmt(total)}</b></p>
      <div class="modal-actions"><button class="btn ghost" data-close>Отмена</button><button class="btn" id="confirmSell">Продать</button></div>`);
    $('#confirmSell').onclick = () => { sell(state.inv.map(i => i.uid)); closeModal(); pageInventory(); };
  };
  draw();
}

/* ---------- upgrade ---------- */
function pageUpgrade() {
  let src = null, target = null, spinning = false, rot = 0;
  app.innerHTML = `
  <h1 class="page-title">Апгрейд</h1>
  <section class="upg">
    <div class="upg-slot" id="srcSlot"><span>Выберите предмет из инвентаря</span></div>
    <div class="wheel-wrap">
      <div class="wheel" id="wheel"><div class="wheel-in"><b id="chance">0%</b><span>шанс</span></div></div>
      <i class="needle" id="needle"></i>
      <button class="btn big" id="upBtn" disabled>Апгрейд</button>
    </div>
    <div class="upg-slot" id="tgtSlot"><span>Выберите цель</span></div>
  </section>
  <div class="upg-lists">
    <div>
      <h2 class="sec">Ваши предметы</h2>
      <div class="grid small" id="srcList"></div>
    </div>
    <div>
      <h2 class="sec">Цель <span class="mults">${[1.5, 2, 3, 5, 10].map(m => `<button data-m="${m}">x${m}</button>`).join('')}</span></h2>
      <div class="grid small" id="tgtList"></div>
    </div>
  </div>`;
  const allTargets = SKINS.flatMap(s => WEARS.filter(w => ['FN', 'FT'].includes(w.id)).map(w => ({ id: s.id, wear: w.id, price: Math.round(s.p * w.mult), uid: s.id + w.id })))
    .sort((a, b) => a.price - b.price);
  const chance = () => src && target ? Math.min(75, src.price / target.price * 95) : 0;

  const draw = () => {
    $('#srcList').innerHTML = state.inv.length ? [...state.inv].sort((a, b) => b.price - a.price).map(it => card(it, 'pick' + (src && src.uid === it.uid ? ' sel' : ''))).join('')
      : `<div class="empty">Инвентарь пуст. <a href="#/">Открыть кейс</a></div>`;
    const tg = allTargets.filter(t => !src || t.price > src.price * 1.2);
    $('#tgtList').innerHTML = tg.map(t => card(t, 'pick' + (target && target.uid === t.uid ? ' sel' : ''))).join('');
    $('#srcSlot').innerHTML = src ? card(src, 'big') : '<span>Выберите предмет из инвентаря</span>';
    $('#tgtSlot').innerHTML = target ? card(target, 'big') : '<span>Выберите цель</span>';
    const ch = chance();
    $('#chance').textContent = ch.toFixed(2) + '%';
    $('#wheel').style.setProperty('--ch', ch * 3.6 + 'deg');
    $('#upBtn').disabled = !(src && target) || spinning;
  };
  $('#srcList').onclick = e => {
    const el = e.target.closest('.item'); if (!el || spinning) return;
    src = state.inv.find(i => i.uid === el.dataset.uid);
    if (target && target.price <= src.price * 1.2) target = null;
    draw();
  };
  $('#tgtList').onclick = e => {
    const el = e.target.closest('.item'); if (!el || spinning) return;
    target = allTargets.find(t => t.uid === el.dataset.uid); draw();
  };
  $$('.mults button').forEach(b => b.onclick = () => {
    if (!src || spinning) return toast('Сначала выберите свой предмет');
    const want = src.price * +b.dataset.m;
    target = allTargets.filter(t => t.price > src.price * 1.2).reduce((best, t) => !best || Math.abs(t.price - want) < Math.abs(best.price - want) ? t : best, null);
    draw();
  });
  $('#upBtn').onclick = () => {
    if (!src || !target || spinning) return;
    spinning = true; draw();
    const ch = chance();
    const roll = Math.random() * 100;
    const win = roll < ch;
    state.inv = state.inv.filter(i => i.uid !== src.uid);
    state.stats.upgrades++; if (win) state.stats.upWins++;
    save();
    rot = rot - (rot % 360) + 360 * 5 + roll * 3.6;
    const needle = $('#needle');
    needle.style.transition = `transform ${state.fast ? 1500 : 4500}ms cubic-bezier(.12,.7,.15,1)`;
    needle.style.transform = `rotate(${rot}deg)`;
    setTimeout(() => {
      $('#wheel').classList.add(win ? 'won' : 'lost');
      if (win) {
        const it = makeItem(target.id, WEARS.find(w => w.id === target.wear));
        addDrop(it, 'Апгрейд'); save();
        modal(`<h2 class="ok">Апгрейд успешен!</h2><div class="win-grid">${card(it, 'big')}</div>
          <div class="modal-actions"><button class="btn ghost" data-close>Забрать</button><button class="btn" id="sellOne">Продать за <span class="coin"></span>${fmt(it.price)}</button></div>`);
        $('#sellOne').onclick = () => { sell([it.uid]); closeModal(); if (location.hash === '#/upgrade') pageUpgrade(); };
      } else {
        toast('Не повезло — предмет сгорел');
      }
      setTimeout(() => {
        $('#wheel') && $('#wheel').classList.remove('won', 'lost');
        spinning = false; src = null; if (location.hash === '#/upgrade') draw();
      }, 1200);
    }, (state.fast ? 1500 : 4500) + 200);
  };
  draw();
}

/* ---------- contract ---------- */
function pageContract() {
  const sel = new Set();
  app.innerHTML = `
  <h1 class="page-title">Контракт</h1>
  <p class="muted center">Положите от 3 до 10 предметов — получите один случайный скин стоимостью от 0.5x до 2x от суммы вклада.</p>
  <section class="contract">
    <div class="c-slots" id="cSlots"></div>
    <div class="c-info">
      <div>Сумма: <span class="coin"></span><b id="cSum">0</b></div>
      <div class="muted" id="cRange">Возможный дроп: —</div>
      <button class="btn big" id="cBtn" disabled>Подписать контракт</button>
    </div>
  </section>
  <h2 class="sec">Ваши предметы</h2>
  <div class="grid small" id="cList"></div>`;
  const draw = () => {
    const items = state.inv.filter(i => sel.has(i.uid));
    const sum = items.reduce((a, x) => a + x.price, 0);
    $('#cSlots').innerHTML = Array.from({ length: 10 }, (_, i) => items[i] ? card(items[i], 'mini') : '<div class="c-empty"></div>').join('');
    $('#cSum').textContent = fmt(sum);
    $('#cRange').textContent = sum ? `Возможный дроп: ${fmt(sum * 0.5)} – ${fmt(sum * 2)}` : 'Возможный дроп: —';
    $('#cBtn').disabled = sel.size < 3;
    $('#cList').innerHTML = state.inv.length ? [...state.inv].sort((a, b) => b.price - a.price).map(it => card(it, 'pick' + (sel.has(it.uid) ? ' sel' : ''))).join('')
      : `<div class="empty">Инвентарь пуст. <a href="#/">Открыть кейс</a></div>`;
  };
  $('#cList').onclick = e => {
    const el = e.target.closest('.item'); if (!el) return;
    const u = el.dataset.uid;
    if (sel.has(u)) sel.delete(u); else if (sel.size < 10) sel.add(u); else toast('Максимум 10 предметов');
    draw();
  };
  $('#cBtn').onclick = () => {
    const items = state.inv.filter(i => sel.has(i.uid));
    const sum = items.reduce((a, x) => a + x.price, 0);
    // skewed toward lower values: expected ≈ 0.92x
    const k = 0.5 * Math.pow(4, Math.pow(Math.random(), 1.35));
    const want = sum * k;
    const pool = SKINS.flatMap(s => WEARS.map(w => ({ s, w, price: Math.round(s.p * w.mult) })));
    const best = pool.reduce((b, x) => !b || Math.abs(x.price - want) < Math.abs(b.price - want) ? x : b, null);
    state.inv = state.inv.filter(i => !sel.has(i.uid));
    const it = makeItem(best.s.id, best.w);
    addDrop(it, 'Контракт'); save(); sel.clear(); draw();
    modal(`<h2>Результат контракта</h2><div class="win-grid">${card(it, 'big')}</div>
      <p class="muted">Вклад: ${fmt(sum)} → ${fmt(it.price)} (${(it.price / sum).toFixed(2)}x)</p>
      <div class="modal-actions"><button class="btn ghost" data-close>Забрать</button><button class="btn" id="sellOne">Продать за <span class="coin"></span>${fmt(it.price)}</button></div>`);
    $('#sellOne').onclick = () => { sell([it.uid]); closeModal(); if (location.hash === '#/contract') pageContract(); };
  };
  draw();
}

/* ---------- router ---------- */
function route() {
  const h = location.hash.replace(/^#\/?/, '');
  const [p, arg] = h.split('/');
  $$('.menu a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#/' + (p || '')));
  closeModal();
  if (p === 'case') pageCase(arg);
  else if (p === 'inventory') pageInventory();
  else if (p === 'upgrade') pageUpgrade();
  else if (p === 'contract') pageContract();
  else pageHome();
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);
renderHeader(); route();
})();
