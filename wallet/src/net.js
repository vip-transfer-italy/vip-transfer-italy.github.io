// Сетевой слой: публичные API без ключей. Адреса узлов можно поменять в настройках.
import { USDT, tronToHex, bytesToHex } from './core.js';

export const DEFAULT_ENDPOINTS = {
  eth: 'https://ethereum-rpc.publicnode.com',
  tron: 'https://api.trongrid.io',
  btc: 'https://mempool.space/api'
};

export const EXPLORERS = {
  eth: (h) => `https://etherscan.io/tx/${h}`,
  tron: (h) => `https://tronscan.org/#/transaction/${h}`,
  btc: (h) => `https://mempool.space/tx/${h}`
};

let EP = { ...DEFAULT_ENDPOINTS };
export const setEndpoints = (e) => { EP = { ...DEFAULT_ENDPOINTS, ...e }; };
export const getEndpoints = () => ({ ...EP });

async function http(url, opts = {}) {
  const r = await fetch(url, opts);
  const text = await r.text();
  if (!r.ok) throw new Error(`${new URL(url).host}: ${r.status} ${text.slice(0, 200)}`);
  try { return JSON.parse(text); } catch { return text; }
}
const post = (url, body) => http(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

// ---------- Ethereum ----------
let rpcId = 0;
export async function ethRpc(method, params = []) {
  const res = await post(EP.eth, { jsonrpc: '2.0', id: ++rpcId, method, params });
  if (res.error) throw new Error(`ETH RPC: ${res.error.message}`);
  return res.result;
}
const pad = (a) => a.slice(2).toLowerCase().padStart(64, '0');
export async function ethBalances(addr) {
  const [eth, usdt] = await Promise.all([
    ethRpc('eth_getBalance', [addr, 'latest']),
    ethRpc('eth_call', [{ to: USDT.eth, data: '0x70a08231' + pad(addr) }, 'latest'])
  ]);
  return { eth: BigInt(eth), usdt: BigInt(usdt === '0x' ? 0 : usdt) };
}
export async function ethFeeData() {
  const [block, tip] = await Promise.all([
    ethRpc('eth_getBlockByNumber', ['latest', false]),
    ethRpc('eth_maxPriorityFeePerGas').catch(() => '0x3b9aca00')
  ]);
  const base = BigInt(block.baseFeePerGas), priority = BigInt(tip);
  return { maxPriorityFeePerGas: priority, maxFeePerGas: base * 2n + priority };
}
export const ethNonce = async (a) => BigInt(await ethRpc('eth_getTransactionCount', [a, 'pending']));
export async function ethEstimateGas({ from, to, value = 0n, data }) {
  const tx = { from, to, value: '0x' + value.toString(16) };
  if (data?.length) tx.data = '0x' + bytesToHex(data);
  return BigInt(await ethRpc('eth_estimateGas', [tx]));
}
export const ethBroadcast = (raw) => ethRpc('eth_sendRawTransaction', [raw]);

// ---------- TRON ----------
export async function tronBalances(addr) {
  const res = await http(`${EP.tron}/v1/accounts/${addr}`);
  const acc = res.data?.[0];
  if (!acc) return { trx: 0n, usdt: 0n, active: false };
  const t = (acc.trc20 || []).find((x) => x[USDT.tron]);
  return { trx: BigInt(acc.balance || 0), usdt: BigInt(t ? t[USDT.tron] : 0), active: true };
}
export async function tronBuildTrx(from, to, amountSun) {
  const tx = await post(`${EP.tron}/wallet/createtransaction`, { owner_address: from, to_address: to, amount: Number(amountSun), visible: true });
  if (!tx.txID) throw new Error('TRON: ' + (tx.Error || JSON.stringify(tx).slice(0, 200)));
  return tx;
}
export async function tronBuildUsdt(from, to, amount, feeLimitSun) {
  const parameter = tronToHex(to).slice(2).padStart(64, '0') + amount.toString(16).padStart(64, '0');
  const res = await post(`${EP.tron}/wallet/triggersmartcontract`, {
    owner_address: from, contract_address: USDT.tron, function_selector: 'transfer(address,uint256)',
    parameter, fee_limit: Number(feeLimitSun), call_value: 0, visible: true
  });
  if (!res.result?.result || !res.transaction) throw new Error('TRON: ' + decodeMsg(res.result?.message) + JSON.stringify(res).slice(0, 200));
  return res.transaction;
}
// Оценка расхода энергии на перевод USDT (сколько TRX может сгореть)
export async function tronEstimateUsdtEnergy(from, to, amount) {
  try {
    const parameter = tronToHex(to).slice(2).padStart(64, '0') + amount.toString(16).padStart(64, '0');
    const r = await post(`${EP.tron}/wallet/triggerconstantcontract`, { owner_address: from, contract_address: USDT.tron, function_selector: 'transfer(address,uint256)', parameter, visible: true });
    return r.energy_used ? BigInt(r.energy_used) : null;
  } catch { return null; }
}
export async function tronBroadcast(signed) {
  const r = await post(`${EP.tron}/wallet/broadcasttransaction`, signed);
  if (!r.result) throw new Error('TRON: ' + (decodeMsg(r.message) || r.code || 'ошибка отправки'));
  return signed.txID;
}
function decodeMsg(m) {
  if (!m) return '';
  if (/^[0-9a-f]+$/i.test(m)) { try { return new TextDecoder().decode(Uint8Array.from(m.match(/../g).map((h) => parseInt(h, 16)))); } catch {} }
  return m;
}

// ---------- Bitcoin ----------
export async function btcBalance(addr) {
  const a = await http(`${EP.btc}/address/${addr}`);
  const c = a.chain_stats, m = a.mempool_stats;
  return { confirmed: BigInt(c.funded_txo_sum - c.spent_txo_sum), pending: BigInt(m.funded_txo_sum - m.spent_txo_sum) };
}
export const btcUtxos = (addr) => http(`${EP.btc}/address/${addr}/utxo`);
export const btcFees = () => http(`${EP.btc}/v1/fees/recommended`);
export const btcBroadcast = (hex) => http(`${EP.btc}/tx`, { method: 'POST', body: hex });
