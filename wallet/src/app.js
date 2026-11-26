import * as C from './core.js';
import * as N from './net.js';
import qrcode from 'qrcode-generator';

const STORE = 'cw.vault.v1', SETTINGS = 'cw.settings.v1';
const AUTOLOCK_MS = 5 * 60 * 1000;
const $ = (s) => document.querySelector(s);
const app = $('#app');

// Активы: сеть, символ, знаков после запятой
const ASSETS = [
  { id: 'btc', chain: 'btc', sym: 'BTC', name: 'Bitcoin', net: 'Bitcoin', dec: 8, icon: '₿' },
  { id: 'eth', chain: 'eth', sym: 'ETH', name: 'Ethereum', net: 'Ethereum', dec: 18, icon: 'Ξ' },
  { id: 'usdt-erc20', chain: 'eth', sym: 'USDT', name: 'Tether', net: 'Ethereum · ERC-20', dec: 6, icon: '₮' },
  { id: 'trx', chain: 'tron', sym: 'TRX', name: 'TRON', net: 'TRON', dec: 6, icon: 'T' },
  { id: 'usdt-trc20', chain: 'tron', sym: 'USDT', name: 'Tether', net: 'TRON · TRC-20', dec: 6, icon: '₮' }
];

let keys = null;          // приватные ключи живут только в памяти, пока кошелёк открыт
let balances = {};        // id -> bigint | undefined
let balErr = {};
let lockTimer;

// ---------- хранилище ----------
const ls = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch {} }
};
N.setEndpoints(ls.get(SETTINGS)?.endpoints || {});

// ---------- утилиты UI ----------
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function render(html) { app.innerHTML = html; window.scrollTo(0, 0); }
function toast(msg, kind = '') {
  const t = document.createElement('div'); t.className = 'toast ' + kind; t.textContent = msg;
  document.body.append(t); setTimeout(() => t.remove(), 3500);
}
async function copy(text) {
  try { await navigator.clipboard.writeText(text); toast('Скопировано'); } catch { toast('Не удалось скопировать', 'err'); }
}
function busy(btn, on, label) {
  if (!btn) return;
  if (on) { btn.dataset.l = btn.textContent; btn.textContent = label || 'Подождите…'; btn.disabled = true; }
  else { btn.textContent = btn.dataset.l || btn.textContent; btn.disabled = false; }
}
const addrOf = (a) => keys[a.chain].address;
const fmt = (v, dec, max = 8) => v === undefined ? '—' : C.formatUnits(v, dec, max);
function header(title, back) {
  return `<header class="top">${back ? `<button class="icon-btn" data-go="${back}" aria-label="Назад">←</button>` : '<span class="logo">◈</span>'}<h1>${esc(title)}</h1>${keys ? '<button class="icon-btn" data-go="settings" aria-label="Настройки">⚙</button>' : '<span></span>'}</header>`;
}

// ---------- навигация ----------
app.addEventListener('click', (e) => {
  const go = e.target.closest('[data-go]'); if (go) { e.preventDefault(); route(go.dataset.go, go.dataset); }
  const cp = e.target.closest('[data-copy]'); if (cp) copy(cp.dataset.copy);
});
function route(name, d = {}) {
  ({ welcome, create: createFlow, import: importFlow, unlock, home, settings, receive: () => receive(d.asset), send: () => send(d.asset) }[name] || home)();
}

// ---------- автоблокировка ----------
function bumpLock() { clearTimeout(lockTimer); if (keys) lockTimer = setTimeout(lock, AUTOLOCK_MS); }
['click', 'keydown', 'touchstart'].forEach((ev) => document.addEventListener(ev, bumpLock, { passive: true }));
function lock() {
  if (keys) for (const c of Object.values(keys)) c.priv.fill(0);
  keys = null; balances = {}; clearTimeout(lockTimer); unlock();
}

// ---------- экраны ----------
function welcome() {
  render(`${header('Мой кошелёк')}
  <section class="card hero">
    <div class="hero-mark">◈</div>
    <h2>Кошелёк для BTC, ETH и USDT</h2>
    <p class="muted">Ключи создаются и хранятся только на этом устройстве в зашифрованном виде. Никаких серверов и регистрации.</p>
    <button class="btn primary" data-go="create">Создать новый кошелёк</button>
    <button class="btn" data-go="import">У меня есть секретная фраза</button>
  </section>`);
}

function createFlow() {
  const m = C.newMnemonic();
  const words = m.split(' ');
  render(`${header('Секретная фраза', 'welcome')}
  <section class="card">
    <div class="warn"><b>Запишите эти 12 слов на бумаге</b> по порядку и храните в надёжном месте. Это единственный способ восстановить доступ к деньгам. Кто знает фразу — владеет деньгами. Не делайте скриншот и не отправляйте её никому.</div>
    <ol class="words blur" id="words">${words.map((w) => `<li>${w}</li>`).join('')}</ol>
    <button class="btn" id="reveal">Показать фразу</button>
    <label class="check"><input type="checkbox" id="saved"> Я записал(а) фразу на бумагу</label>
    <button class="btn primary" id="next" disabled>Далее</button>
  </section>`);
  $('#reveal').onclick = () => { $('#words').classList.remove('blur'); $('#reveal').remove(); };
  $('#saved').onchange = (e) => { $('#next').disabled = !e.target.checked; };
  $('#next').onclick = () => verifyPhrase(m);
}

function verifyPhrase(m) {
  const words = m.split(' ');
  const idx = [...Array(12).keys()].sort(() => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32 - 0.5).slice(0, 3).sort((a, b) => a - b);
  render(`${header('Проверка фразы', 'welcome')}
  <section class="card">
    <p class="muted">Введите слова под указанными номерами, чтобы убедиться, что фраза записана верно.</p>
    ${idx.map((i) => `<label class="field"><span>Слово №${i + 1}</span><input data-i="${i}" autocomplete="off" autocapitalize="off" spellcheck="false"></label>`).join('')}
    <button class="btn primary" id="ok">Проверить</button>
    <button class="btn ghost" id="back">Показать фразу ещё раз</button>
  </section>`);
  $('#back').onclick = () => { createFlowWith(m); };
  $('#ok').onclick = () => {
    const good = [...document.querySelectorAll('[data-i]')].every((el) => el.value.trim().toLowerCase() === words[+el.dataset.i]);
    if (!good) return toast('Слова не совпадают — проверьте запись', 'err');
    setPassword(m);
  };
}
function createFlowWith(m) {
  render(`${header('Секретная фраза', 'welcome')}<section class="card"><ol class="words">${m.split(' ').map((w) => `<li>${w}</li>`).join('')}</ol><button class="btn primary" id="n">Далее</button></section>`);
  $('#n').onclick = () => verifyPhrase(m);
}

function importFlow() {
  render(`${header('Восстановление', 'welcome')}
  <section class="card">
    <p class="muted">Введите секретную фразу из 12 или 24 слов через пробел. Подходит фраза из Trust Wallet, MetaMask, TronLink и других BIP39-кошельков.</p>
    <label class="field"><span>Секретная фраза</span><textarea id="m" rows="4" autocomplete="off" autocapitalize="off" spellcheck="false"></textarea></label>
    <button class="btn primary" id="go">Продолжить</button>
  </section>`);
  $('#go').onclick = () => {
    const m = C.normalizeMnemonic($('#m').value);
    if (!C.isValidMnemonic(m)) return toast('Фраза неверная: проверьте слова и их порядок', 'err');
    setPassword(m);
  };
}

function setPassword(m) {
  render(`${header('Пароль', 'welcome')}
  <section class="card">
    <p class="muted">Пароль шифрует фразу на этом устройстве и нужен для входа и отправки. Если забудете — восстановите кошелёк по секретной фразе.</p>
    <label class="field"><span>Пароль (минимум 8 символов)</span><input type="password" id="p1" autocomplete="new-password"></label>
    <label class="field"><span>Повторите пароль</span><input type="password" id="p2" autocomplete="new-password"></label>
    <button class="btn primary" id="save">Создать кошелёк</button>
  </section>`);
  $('#save').onclick = async (e) => {
    const p1 = $('#p1').value, p2 = $('#p2').value;
    if (p1.length < 8) return toast('Пароль слишком короткий', 'err');
    if (p1 !== p2) return toast('Пароли не совпадают', 'err');
    busy(e.target, true, 'Шифрую…');
    const box = await C.encryptSecret(m, p1);
    if (!ls.set(STORE, box)) { busy(e.target, false); return toast('Браузер не даёт сохранить данные (приватный режим?)', 'err'); }
    keys = C.deriveKeys(m); bumpLock(); if (!window.isSecureContext || !crypto?.subtle) {
  render(`${header('Мой кошелёк')}<section class="card"><div class="warn">Откройте кошелёк по адресу <b>https://</b> (или с localhost). Браузер разрешает шифрование только на защищённых страницах.</div></section>`);
} else home();
  };
}

function unlock() {
  render(`${header('Мой кошелёк')}
  <section class="card hero">
    <div class="hero-mark">◈</div>
    <h2>Кошелёк заблокирован</h2>
    <form id="f"><label class="field"><span>Пароль</span><input type="password" id="p" autocomplete="current-password" autofocus></label>
    <button class="btn primary" id="go">Разблокировать</button></form>
    <button class="btn ghost" id="forgot">Забыли пароль?</button>
  </section>`);
  $('#f').onsubmit = async (e) => {
    e.preventDefault(); const btn = $('#go'); busy(btn, true, 'Проверяю…');
    try { keys = C.deriveKeys(await C.decryptSecret(ls.get(STORE), $('#p').value)); bumpLock(); home(); }
    catch (err) { busy(btn, false); toast(err.message, 'err'); }
  };
  $('#forgot').onclick = () => {
    if (confirm('Удалить кошелёк с этого устройства и восстановить его по секретной фразе?\n\nБез фразы доступ к деньгам будет потерян навсегда.')) { ls.del(STORE); importFlow(); }
  };
}

async function refreshBalances() {
  balErr = {};
  const jobs = [
    N.btcBalance(keys.btc.address).then((b) => { balances.btc = b.confirmed + b.pending; balances.btcPending = b.pending; }).catch((e) => { balErr.btc = e.message; }),
    N.ethBalances(keys.eth.address).then((b) => { balances.eth = b.eth; balances['usdt-erc20'] = b.usdt; }).catch((e) => { balErr.eth = e.message; }),
    N.tronBalances(keys.tron.address).then((b) => { balances.trx = b.trx; balances['usdt-trc20'] = b.usdt; }).catch((e) => { balErr.tron = e.message; })
  ];
  await Promise.all(jobs);
}

function home() {
  if (!keys) return ls.get(STORE) ? unlock() : welcome();
  const usdtTotal = (balances['usdt-erc20'] ?? 0n) + (balances['usdt-trc20'] ?? 0n);
  render(`${header('Мой кошелёк')}
  <section class="card total">
    <span class="muted">Всего USDT</span>
    <strong>${C.formatUnits(usdtTotal, 6, 2)} <small>USDT</small></strong>
    <button class="btn small" id="refresh">↻ Обновить</button>
  </section>
  <section class="list">
    ${ASSETS.map((a) => `
    <div class="asset">
      <div class="asset-icon ${a.chain}">${a.icon}</div>
      <div class="asset-info"><b>${a.sym}</b><span class="muted">${a.net}</span></div>
      <div class="asset-bal">${balErr[a.chain] ? '<span class="err-text" title="' + esc(balErr[a.chain]) + '">нет связи</span>' : fmt(balances[a.id], a.dec, a.dec === 18 ? 6 : a.dec)}
        ${a.id === 'btc' && balances.btcPending ? `<span class="muted tiny">в ожидании ${fmt(balances.btcPending, 8)}</span>` : ''}</div>
      <div class="asset-actions">
        <button class="btn small" data-go="receive" data-asset="${a.id}">Получить</button>
        <button class="btn small primary" data-go="send" data-asset="${a.id}">Отправить</button>
      </div>
    </div>`).join('')}
  </section>`);
  $('#refresh').onclick = async (e) => { busy(e.target, true, 'Обновляю…'); await refreshBalances(); home(); };
  if (!('btc' in balances) && !Object.keys(balErr).length) refreshBalances().then(() => keys && $('.total') && home());
}

function receive(id) {
  const a = ASSETS.find((x) => x.id === id), addr = addrOf(a);
  const qr = qrcode(0, 'M'); qr.addData(addr); qr.make();
  const note = {
    btc: 'Принимайте только Bitcoin (BTC) в сети Bitcoin.',
    eth: 'Принимайте только ETH в сети Ethereum (ERC-20).',
    'usdt-erc20': 'Только USDT в сети <b>Ethereum (ERC-20)</b>. Для отправки потом понадобится немного ETH на комиссию.',
    trx: 'Принимайте только TRX в сети TRON.',
    'usdt-trc20': 'Только USDT в сети <b>TRON (TRC-20)</b>. Для отправки потом понадобится TRX на комиссию (обычно 15–30 TRX).'
  }[id];
  render(`${header('Получить ' + a.sym, 'home')}
  <section class="card center">
    <span class="badge ${a.chain}">${a.net}</span>
    <div class="qr">${qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true })}</div>
    <code class="addr">${esc(addr)}</code>
    <button class="btn primary" data-copy="${esc(addr)}">Скопировать адрес</button>
    <div class="warn">${note} Монеты из другой сети могут быть потеряны.</div>
  </section>`);
}

// ---------- отправка ----------
function send(id) {
  const a = ASSETS.find((x) => x.id === id);
  const bal = balances[a.id];
  const validators = { btc: C.isValidBtcAddress, eth: C.isValidEthAddress, tron: C.isValidTronAddress };
  render(`${header('Отправить ' + a.sym, 'home')}
  <section class="card">
    <span class="badge ${a.chain}">${a.net}</span>
    <p class="muted">Доступно: <b>${fmt(bal, a.dec)} ${a.sym}</b></p>
    <label class="field"><span>Адрес получателя (${a.net})</span><input id="to" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${{ btc: 'bc1…', eth: '0x…', tron: 'T…' }[a.chain]}"></label>
    <label class="field"><span>Сумма, ${a.sym}</span><div class="row"><input id="amt" inputmode="decimal" placeholder="0.00"><button class="btn small" id="max">Всё</button></div></label>
    ${a.id === 'btc' ? `<label class="field"><span>Скорость</span><select id="speed"><option value="fastestFee">Быстро (~10 мин)</option><option value="halfHourFee" selected>Обычно (~30 мин)</option><option value="hourFee">Медленно (~1 час)</option></select></label>` : ''}
    <button class="btn primary" id="review">Проверить перевод</button>
  </section>`);
  let sendAll = false;
  $('#amt').oninput = () => { sendAll = false; };
  $('#max').onclick = () => {
    if (bal === undefined) return toast('Баланс ещё не загружен', 'err');
    sendAll = true; $('#amt').value = C.formatUnits(bal, a.dec);
    if (a.id === 'eth' || a.id === 'trx') toast('Комиссия будет вычтена из суммы');
  };
  $('#review').onclick = async (e) => {
    const to = $('#to').value.trim();
    if (!validators[a.chain](to)) return toast(`Это не адрес сети ${a.net}`, 'err');
    if (to.toLowerCase() === addrOf(a).toLowerCase()) return toast('Это ваш собственный адрес', 'err');
    let amount;
    try { amount = C.parseUnits($('#amt').value, a.dec); } catch (err) { return toast(err.message, 'err'); }
    if (amount <= 0n && !sendAll) return toast('Введите сумму', 'err');
    busy(e.target, true, 'Считаю комиссию…');
    try {
      const plan = await prepare(a, to, amount, sendAll, $('#speed')?.value);
      confirmScreen(a, plan);
    } catch (err) { busy(e.target, false); toast(err.message, 'err'); }
  };
}

// Готовит перевод: считает комиссию, но ещё ничего не отправляет.
async function prepare(a, to, amount, sendAll, speed) {
  if (a.chain === 'eth') {
    const k = keys.eth, isToken = a.id === 'usdt-erc20';
    const [fee, nonce, bal] = await Promise.all([N.ethFeeData(), N.ethNonce(k.address), N.ethBalances(k.address)]);
    const data = isToken ? C.erc20TransferData(to, amount) : new Uint8Array();
    const txTo = isToken ? C.USDT.eth : to;
    let gasLimit = isToken ? (await N.ethEstimateGas({ from: k.address, to: txTo, data })) * 12n / 10n : 21000n;
    if (!isToken && (await N.ethRpc('eth_getCode', [to, 'latest'])) !== '0x') gasLimit = (await N.ethEstimateGas({ from: k.address, to, value: 1n })) * 12n / 10n;
    const maxFee = gasLimit * fee.maxFeePerGas;
    let value = isToken ? 0n : amount;
    if (!isToken && sendAll) { value = bal.eth - maxFee; if (value <= 0n) throw new Error('Не хватает ETH на комиссию'); }
    if (isToken && amount > bal.usdt) throw new Error('Недостаточно USDT');
    if (bal.eth < value + maxFee) throw new Error(`Не хватает ETH на комиссию: нужно до ${C.formatUnits(maxFee, 18, 6)} ETH`);
    return {
      to, amount: isToken ? amount : value, feeText: `до ${C.formatUnits(maxFee, 18, 6)} ETH`,
      exec: async () => {
        const s = C.signEthTx(k.priv, { chainId: 1n, nonce, ...fee, gasLimit, to: txTo, value, data });
        await N.ethBroadcast(s.raw); return s.hash;
      }
    };
  }
  if (a.chain === 'tron') {
    const k = keys.tron, ownerHex = C.tronToHex(k.address), bal = await N.tronBalances(k.address);
    if (a.id === 'trx') {
      // перевод TRX сжигает до ~0.27 TRX, если не хватает бесплатной пропускной способности; 1.1 TRX — если адрес получателя новый
      const reserve = 1_100_000n;
      if (sendAll) amount = bal.trx - reserve;
      if (amount <= 0n || amount + reserve > bal.trx) throw new Error('Недостаточно TRX (оставьте ~1.1 TRX на комиссию)');
      return {
        to, amount, feeText: '0–1.1 TRX (зависит от сети и получателя)',
        exec: async () => {
          const tx = await N.tronBuildTrx(k.address, to, amount);
          return N.tronBroadcast(C.signTronTx(k.priv, tx, { kind: 'trx', ownerHex, toHex: C.tronToHex(to), amount }));
        }
      };
    }
    if (sendAll) amount = bal.usdt;
    if (amount <= 0n || amount > bal.usdt) throw new Error('Недостаточно USDT');
    const energy = await N.tronEstimateUsdtEnergy(k.address, to, amount);
    const feeLimit = 50_000_000n; // не больше 50 TRX сгорит в худшем случае
    if (bal.trx < 15_000_000n) throw new Error('Для перевода USDT в TRON нужно минимум ~15 TRX на балансе (лучше 30)');
    const est = energy ? `≈ ${C.formatUnits(energy * 210n, 6, 1)} TRX` : '≈ 13–30 TRX';
    return {
      to, amount, feeText: `${est} (лимит 50 TRX)`,
      exec: async () => {
        const tx = await N.tronBuildUsdt(k.address, to, amount, feeLimit);
        const dataHex = 'a9059cbb' + C.trc20TransferParam(C.tronToHex(to), amount);
        return N.tronBroadcast(C.signTronTx(k.priv, tx, { kind: 'trc20', ownerHex, contractHex: C.tronToHex(C.USDT.tron), dataHex }));
      }
    };
  }
  // btc
  const k = keys.btc;
  const [utxos, fees] = await Promise.all([N.btcUtxos(k.address), N.btcFees()]);
  if (!utxos.length) throw new Error('Нет доступных BTC');
  const feeRate = Math.max(1, fees[speed || 'halfHourFee']);
  const built = C.buildBtcTx(k.priv, utxos, to, amount, feeRate, { sendAll });
  return {
    to, amount: built.amount, feeText: `${C.formatUnits(built.fee, 8)} BTC (${feeRate} сат/vB)`,
    exec: async () => { await N.btcBroadcast(built.hex); return built.txid; }
  };
}

function confirmScreen(a, plan) {
  render(`${header('Подтверждение', 'home')}
  <section class="card">
    <div class="summary">
      <div><span class="muted">Сумма</span><b class="big">${C.formatUnits(plan.amount, a.dec)} ${a.sym}</b></div>
      <div><span class="muted">Сеть</span><b>${a.net}</b></div>
      <div><span class="muted">Получатель</span><code class="addr">${esc(plan.to)}</code></div>
      <div><span class="muted">Комиссия сети</span><b>${esc(plan.feeText)}</b></div>
    </div>
    <div class="warn">Проверьте адрес по первым и последним символам. Транзакции в блокчейне <b>нельзя отменить</b>.</div>
    <label class="field"><span>Пароль для подтверждения</span><input type="password" id="p" autocomplete="current-password"></label>
    <button class="btn primary" id="go">Отправить</button>
    <button class="btn ghost" data-go="home">Отмена</button>
  </section>`);
  $('#go').onclick = async (e) => {
    busy(e.target, true, 'Отправляю…');
    try { await C.decryptSecret(ls.get(STORE), $('#p').value); }
    catch (err) { busy(e.target, false); return toast(err.message, 'err'); }
    try {
      const hash = await plan.exec();
      delete balances.btc; // перезагрузим балансы
      render(`${header('Готово', 'home')}
      <section class="card center">
        <div class="hero-mark ok">✓</div>
        <h2>Транзакция отправлена</h2>
        <p class="muted">Подтверждение в сети занимает от нескольких секунд до часа.</p>
        <code class="addr">${esc(hash)}</code>
        <a class="btn" href="${N.EXPLORERS[a.chain](hash)}" target="_blank" rel="noopener noreferrer">Открыть в обозревателе</a>
        <button class="btn primary" data-go="home">На главную</button>
      </section>`);
    } catch (err) { busy(e.target, false); toast(err.message, 'err'); }
  };
}

// ---------- настройки ----------
function settings() {
  const ep = N.getEndpoints();
  render(`${header('Настройки', 'home')}
  <section class="card">
    <h3>Ваши адреса</h3>
    ${['btc', 'eth', 'tron'].map((c) => `<div class="kv"><span class="muted">${{ btc: 'Bitcoin', eth: 'Ethereum (ETH и USDT ERC-20)', tron: 'TRON (TRX и USDT TRC-20)' }[c]}</span><code class="addr small" data-copy="${keys[c].address}">${keys[c].address}</code></div>`).join('')}
  </section>
  <section class="card">
    <h3>Безопасность</h3>
    <button class="btn" id="show">Показать секретную фразу</button>
    <button class="btn" id="lock">Заблокировать сейчас</button>
    <p class="muted tiny">Кошелёк блокируется сам через 5 минут бездействия.</p>
  </section>
  <section class="card">
    <h3>Узлы сети</h3>
    <p class="muted tiny">Публичные API, через которые кошелёк узнаёт балансы и отправляет транзакции. Ключи на них не передаются.</p>
    <label class="field"><span>Ethereum RPC</span><input id="ep-eth" value="${esc(ep.eth)}"></label>
    <label class="field"><span>TRON API</span><input id="ep-tron" value="${esc(ep.tron)}"></label>
    <label class="field"><span>Bitcoin API (Esplora)</span><input id="ep-btc" value="${esc(ep.btc)}"></label>
    <button class="btn" id="save-ep">Сохранить</button>
    <button class="btn ghost" id="reset-ep">Сбросить по умолчанию</button>
  </section>
  <section class="card danger">
    <h3>Удалить кошелёк</h3>
    <p class="muted tiny">Удаляет зашифрованную фразу с этого устройства. Деньги останутся в блокчейне, но вернуть доступ можно будет только по секретной фразе.</p>
    <button class="btn danger" id="wipe">Удалить с устройства</button>
  </section>`);
  $('#lock').onclick = lock;
  $('#show').onclick = async () => {
    const p = prompt('Введите пароль, чтобы показать фразу'); if (p === null) return;
    try {
      const m = await C.decryptSecret(ls.get(STORE), p);
      render(`${header('Секретная фраза', 'settings')}<section class="card"><div class="warn">Никому не показывайте эти слова. Ни поддержка, ни «администраторы» никогда их не спрашивают.</div><ol class="words">${m.split(' ').map((w) => `<li>${w}</li>`).join('')}</ol><button class="btn primary" data-go="settings">Скрыть</button></section>`);
    } catch (err) { toast(err.message, 'err'); }
  };
  const saveEp = (obj) => { const s = ls.get(SETTINGS) || {}; s.endpoints = obj; ls.set(SETTINGS, s); N.setEndpoints(obj); balances = {}; toast('Сохранено'); settings(); };
  $('#save-ep').onclick = () => {
    const v = { eth: $('#ep-eth').value.trim(), tron: $('#ep-tron').value.trim().replace(/\/$/, ''), btc: $('#ep-btc').value.trim().replace(/\/$/, '') };
    if (Object.values(v).some((u) => !/^https:\/\//.test(u))) return toast('Адреса узлов должны начинаться с https://', 'err');
    saveEp(v);
  };
  $('#reset-ep').onclick = () => saveEp({});
  $('#wipe').onclick = () => {
    if (prompt('Это действие необратимо. Напишите УДАЛИТЬ, если фраза у вас записана.') === 'УДАЛИТЬ') { lock(); ls.del(STORE); welcome(); }
  };
}

if (!window.isSecureContext || !crypto?.subtle) {
  render(`${header('Мой кошелёк')}<section class="card"><div class="warn">Откройте кошелёк по адресу <b>https://</b> (или с localhost). Браузер разрешает шифрование только на защищённых страницах.</div></section>`);
} else home();
