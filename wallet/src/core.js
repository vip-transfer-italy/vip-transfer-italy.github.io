// Ядро кошелька: seed-фраза, вывод ключей, адреса, подпись транзакций.
// Чистые функции без сети — их проверяют тесты в test/core.test.mjs.
import { generateMnemonic, validateMnemonic, mnemonicToSeedSync } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { HDKey } from '@scure/bip32';
import { secp256k1 } from '@noble/curves/secp256k1';
import { keccak_256 } from '@noble/hashes/sha3';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, hexToBytes, concatBytes } from '@noble/hashes/utils';
import { base58check as b58c } from '@scure/base';
import * as btc from '@scure/btc-signer';

const base58check = b58c(sha256);

export const PATHS = {
  btc: "m/84'/0'/0'/0/0",   // BIP84, native SegWit (bc1q…)
  eth: "m/44'/60'/0'/0/0",  // стандарт MetaMask / Trust Wallet
  tron: "m/44'/195'/0'/0/0" // стандарт TronLink / Trust Wallet
};

export const USDT = {
  eth: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  tron: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'
};

// ---------- seed ----------
export const newMnemonic = (strength = 128) => generateMnemonic(wordlist, strength);
export const isValidMnemonic = (m) => validateMnemonic(normalizeMnemonic(m), wordlist);
export const normalizeMnemonic = (m) => m.trim().toLowerCase().split(/\s+/).join(' ');

export function deriveKeys(mnemonic) {
  const seed = mnemonicToSeedSync(normalizeMnemonic(mnemonic));
  const root = HDKey.fromMasterSeed(seed);
  const k = (p) => root.derive(p).privateKey;
  const btcPriv = k(PATHS.btc), ethPriv = k(PATHS.eth), tronPriv = k(PATHS.tron);
  return {
    btc: { priv: btcPriv, address: btcAddress(btcPriv) },
    eth: { priv: ethPriv, address: ethAddress(ethPriv) },
    tron: { priv: tronPriv, address: tronAddress(tronPriv) }
  };
}

// ---------- адреса ----------
const pubHash20 = (priv) => keccak_256(secp256k1.getPublicKey(priv, false).slice(1)).slice(-20);

export function btcAddress(priv) {
  return btc.p2wpkh(secp256k1.getPublicKey(priv, true)).address;
}

export function toChecksumAddress(hex) {
  const a = hex.toLowerCase().replace(/^0x/, '');
  const h = bytesToHex(keccak_256(new TextEncoder().encode(a)));
  let out = '0x';
  for (let i = 0; i < 40; i++) out += parseInt(h[i], 16) >= 8 ? a[i].toUpperCase() : a[i];
  return out;
}
export const ethAddress = (priv) => toChecksumAddress(bytesToHex(pubHash20(priv)));

export function isValidEthAddress(a) {
  if (!/^0x[0-9a-fA-F]{40}$/.test(a)) return false;
  const body = a.slice(2);
  // если адрес в смешанном регистре — проверяем контрольную сумму EIP-55
  if (body !== body.toLowerCase() && body !== body.toUpperCase()) return toChecksumAddress(a) === a;
  return true;
}

export const tronAddress = (priv) => base58check.encode(concatBytes(new Uint8Array([0x41]), pubHash20(priv)));
export function tronToHex(addr) {
  const b = base58check.decode(addr);
  if (b.length !== 21 || b[0] !== 0x41) throw new Error('Неверный TRON-адрес');
  return bytesToHex(b);
}
export function isValidTronAddress(a) { try { tronToHex(a); return true; } catch { return false; } }

export function isValidBtcAddress(a) {
  try { btc.Address(btc.NETWORK).decode(a); return true; } catch { return false; }
}

// ---------- суммы ----------
// "1.5" -> 1500000n при decimals=6. Без float, чтобы не терять копейки.
export function parseUnits(str, decimals) {
  const s = String(str).trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(s)) throw new Error('Неверная сумма');
  const [i, f = ''] = s.split('.');
  if (f.length > decimals) throw new Error(`Не больше ${decimals} знаков после запятой`);
  return BigInt(i) * 10n ** BigInt(decimals) + BigInt((f + '0'.repeat(decimals)).slice(0, decimals) || '0');
}
export function formatUnits(v, decimals, maxFrac = decimals) {
  v = BigInt(v);
  const neg = v < 0n; if (neg) v = -v;
  const base = 10n ** BigInt(decimals);
  let f = (v % base).toString().padStart(decimals, '0').slice(0, maxFrac).replace(/0+$/, '');
  return (neg ? '-' : '') + (v / base).toString() + (f ? '.' + f : '');
}

// ---------- Ethereum: RLP + EIP-1559 ----------
const bigToBytes = (n) => {
  n = BigInt(n);
  if (n === 0n) return new Uint8Array();
  let h = n.toString(16); if (h.length % 2) h = '0' + h;
  return hexToBytes(h);
};
function rlpLen(len, offset) {
  if (len < 56) return new Uint8Array([offset + len]);
  const lb = bigToBytes(len);
  return concatBytes(new Uint8Array([offset + 55 + lb.length]), lb);
}
export function rlp(x) {
  if (Array.isArray(x)) {
    const body = concatBytes(...x.map(rlp));
    return concatBytes(rlpLen(body.length, 0xc0), body);
  }
  const b = x instanceof Uint8Array ? x : bigToBytes(x);
  if (b.length === 1 && b[0] < 0x80) return b;
  return concatBytes(rlpLen(b.length, 0x80), b);
}

export function erc20TransferData(to, amount) {
  return hexToBytes('a9059cbb' + to.slice(2).toLowerCase().padStart(64, '0') + BigInt(amount).toString(16).padStart(64, '0'));
}

// Возвращает подписанную raw-транзакцию (0x02…) и её хеш.
export function signEthTx(priv, { chainId = 1n, nonce, maxPriorityFeePerGas, maxFeePerGas, gasLimit, to, value = 0n, data = new Uint8Array() }) {
  const fields = [chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gasLimit, hexToBytes(to.slice(2)), value, data, []];
  const unsigned = concatBytes(new Uint8Array([2]), rlp(fields));
  const sig = secp256k1.sign(keccak_256(unsigned), priv);
  const signed = concatBytes(new Uint8Array([2]), rlp([...fields, BigInt(sig.recovery), sig.r, sig.s]));
  return { raw: '0x' + bytesToHex(signed), hash: '0x' + bytesToHex(keccak_256(signed)) };
}

// ---------- TRON ----------
// TronGrid собирает транзакцию; мы проверяем, что txID = sha256(raw_data_hex)
// и что в raw_data именно наш получатель и сумма, и только потом подписываем.
export function signTronTx(priv, tx, expect) {
  const rawHex = tx.raw_data_hex;
  if (bytesToHex(sha256(hexToBytes(rawHex))) !== tx.txID) throw new Error('TRON: txID не совпадает с raw_data — подпись отменена');
  const c = tx.raw_data?.contract?.[0];
  const v = c?.parameter?.value || {};
  if (!rawHex.includes(expect.ownerHex)) throw new Error('TRON: в транзакции чужой отправитель');
  if (expect.kind === 'trx') {
    if (c.type !== 'TransferContract') throw new Error('TRON: неожиданный тип транзакции');
    if (!rawHex.includes(expect.toHex)) throw new Error('TRON: получатель в транзакции не совпадает');
    if (BigInt(v.amount) !== expect.amount) throw new Error('TRON: сумма в транзакции не совпадает');
  } else {
    if (c.type !== 'TriggerSmartContract') throw new Error('TRON: неожиданный тип транзакции');
    if (!rawHex.includes(expect.contractHex)) throw new Error('TRON: другой контракт токена');
    if (!rawHex.includes(expect.dataHex)) throw new Error('TRON: данные перевода не совпадают');
  }
  const sig = secp256k1.sign(hexToBytes(tx.txID), priv);
  const sigHex = bytesToHex(concatBytes(hexToBytes(sig.r.toString(16).padStart(64, '0')), hexToBytes(sig.s.toString(16).padStart(64, '0')), new Uint8Array([sig.recovery + 27])));
  return { ...tx, signature: [sigHex] };
}
export function trc20TransferParam(toHex41, amount) {
  return toHex41.slice(2).padStart(64, '0') + BigInt(amount).toString(16).padStart(64, '0');
}

// ---------- Bitcoin ----------
// utxos: [{txid, vout, value}] ; feeRate sat/vB ; сдача возвращается на свой адрес.
export function buildBtcTx(priv, utxos, to, amount, feeRate, { sendAll = false } = {}) {
  const pub = secp256k1.getPublicKey(priv, true);
  const pay = btc.p2wpkh(pub);
  const sorted = [...utxos].sort((a, b) => b.value - a.value);
  const vsize = (ins, outs) => Math.ceil(10.5 + ins * 68 + outs * 31);
  const DUST = 546n;
  let chosen = [], total = 0n, fee = 0n, change = 0n;
  if (sendAll) {
    chosen = sorted; total = sorted.reduce((s, u) => s + BigInt(u.value), 0n);
    fee = BigInt(vsize(chosen.length, 1) * feeRate);
    amount = total - fee;
    if (amount < DUST) throw new Error('Недостаточно BTC с учётом комиссии');
  } else {
    for (const u of sorted) {
      chosen.push(u); total += BigInt(u.value);
      fee = BigInt(vsize(chosen.length, 2) * feeRate);
      if (total >= amount + fee) break;
    }
    if (total < amount + fee) throw new Error('Недостаточно BTC с учётом комиссии');
    change = total - amount - fee;
    if (change < DUST) { fee += change; change = 0n; }
  }
  const tx = new btc.Transaction();
  for (const u of chosen) tx.addInput({ txid: u.txid, index: u.vout, witnessUtxo: { script: pay.script, amount: BigInt(u.value) } });
  tx.addOutputAddress(to, amount, btc.NETWORK);
  if (change > 0n) tx.addOutputAddress(pay.address, change, btc.NETWORK);
  tx.sign(priv); tx.finalize();
  return { hex: tx.hex, txid: tx.id, fee, amount, change };
}

// ---------- шифрование seed-фразы паролем (WebCrypto) ----------
const te = new TextEncoder(), td = new TextDecoder();
async function aesKey(password, salt) {
  const base = await crypto.subtle.importKey('raw', te.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
export async function encryptSecret(text, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await aesKey(password, salt), te.encode(text)));
  return { v: 1, salt: bytesToHex(salt), iv: bytesToHex(iv), ct: bytesToHex(ct) };
}
export async function decryptSecret(box, password) {
  try {
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: hexToBytes(box.iv) }, await aesKey(password, hexToBytes(box.salt)), hexToBytes(box.ct));
    return td.decode(pt);
  } catch { throw new Error('Неверный пароль'); }
}

export { bytesToHex, hexToBytes };
