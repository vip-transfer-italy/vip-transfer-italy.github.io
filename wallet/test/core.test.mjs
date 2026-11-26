import assert from 'node:assert/strict';
import { Transaction, Wallet, HDNodeWallet } from 'ethers';
import * as btc from '@scure/btc-signer';
import { secp256k1 } from '@noble/curves/secp256k1';
import * as C from '../src/core.js';

const M = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const k = C.deriveKeys(M);
// Эталонные адреса для тестовой фразы (Trust Wallet / Ian Coleman BIP39)
assert.equal(k.eth.address, '0x9858EfFD232B4033E47d90003D41EC34EcaEda94');
assert.equal(k.btc.address, 'bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu');
assert.equal(k.eth.address, HDNodeWallet.fromPhrase(M, undefined, "m/44'/60'/0'/0/0").address);
console.log('TRON:', k.tron.address);
assert.equal(k.tron.address, 'TUEZSdKsoDHQMeZwihtdoBiN46zxhGWYdH');
assert.ok(C.isValidTronAddress(k.tron.address) && !C.isValidTronAddress('TUEZSdKsoDHQMeZwihtdoBiN46zxhGWYdx'));
assert.ok(C.isValidEthAddress(k.eth.address) && !C.isValidEthAddress('0x9858EfFD232B4033E47d90003D41EC34EcaEda95'.replace('E','e')));
assert.ok(C.isValidBtcAddress(k.btc.address) && !C.isValidBtcAddress('bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyv'));
assert.ok(C.isValidMnemonic(M) && !C.isValidMnemonic(M.replace('about','abandon')));
assert.equal(C.newMnemonic().split(' ').length, 12);

// Суммы
assert.equal(C.parseUnits('1.5', 6), 1500000n);
assert.equal(C.parseUnits('0,000001', 6), 1n);
assert.throws(() => C.parseUnits('1.0000001', 6));
assert.equal(C.formatUnits(1500000n, 6), '1.5');
assert.equal(C.formatUnits(10n ** 18n, 18), '1');

// ETH: подпись сверяем с ethers
const w = new Wallet('0x' + C.bytesToHex(k.eth.priv));
for (const [to, value, data] of [
  ['0x000000000000000000000000000000000000dEaD', 123456789000000000n, new Uint8Array()],
  [C.USDT.eth, 0n, C.erc20TransferData('0x000000000000000000000000000000000000dEaD', 2500000n)],
]) {
  const p = { chainId: 1n, nonce: 7n, maxPriorityFeePerGas: 1500000000n, maxFeePerGas: 30000000000n, gasLimit: 65000n, to, value, data };
  const mine = C.signEthTx(k.eth.priv, p);
  const ref = await w.signTransaction({ type: 2, ...p, data: '0x' + C.bytesToHex(data) });
  assert.equal(mine.raw, ref);
  const parsed = Transaction.from(mine.raw);
  assert.equal(parsed.from, k.eth.address);
  assert.equal(mine.hash, parsed.hash);
}

// TRON: подпись восстанавливается в наш адрес; подмена данных ловится
const owner = C.tronToHex(k.tron.address), toHex = C.tronToHex('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t');
const raw = '0a02' + 'abcd' + owner + toHex + '10c0843d';
const tx = { txID: C.bytesToHex((await import('@noble/hashes/sha256')).sha256(C.hexToBytes(raw))), raw_data_hex: raw,
  raw_data: { contract: [{ type: 'TransferContract', parameter: { value: { amount: 1000000 } } }] } };
const signed = C.signTronTx(k.tron.priv, tx, { kind: 'trx', ownerHex: owner, toHex, amount: 1000000n });
const s = signed.signature[0];
const sig = new secp256k1.Signature(BigInt('0x' + s.slice(0, 64)), BigInt('0x' + s.slice(64, 128))).addRecoveryBit(parseInt(s.slice(128), 16) - 27);
assert.equal(C.bytesToHex(sig.recoverPublicKey(tx.txID).toRawBytes(true)), C.bytesToHex(secp256k1.getPublicKey(k.tron.priv, true)));
assert.throws(() => C.signTronTx(k.tron.priv, tx, { kind: 'trx', ownerHex: owner, toHex, amount: 2000000n }));
assert.throws(() => C.signTronTx(k.tron.priv, { ...tx, txID: '00'.repeat(32) }, { kind: 'trx', ownerHex: owner, toHex, amount: 1000000n }));

// BTC: собираем и проверяем транзакцию
const utxos = [{ txid: 'aa'.repeat(32), vout: 0, value: 50000 }, { txid: 'bb'.repeat(32), vout: 1, value: 20000 }];
const r = C.buildBtcTx(k.btc.priv, utxos, 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq', 30000n, 5);
const t = btc.Transaction.fromRaw(C.hexToBytes(r.hex));
assert.equal(t.inputsLength, 1); assert.equal(t.getOutput(0).amount, 30000n);
assert.equal(t.getOutput(1).amount + 30000n + r.fee, 50000n);
const all = C.buildBtcTx(k.btc.priv, utxos, 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq', 0n, 5, { sendAll: true });
assert.equal(all.amount + all.fee, 70000n);
assert.throws(() => C.buildBtcTx(k.btc.priv, utxos, 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq', 70000n, 5));

// Шифрование
const box = await C.encryptSecret(M, 'pass123');
assert.equal(await C.decryptSecret(box, 'pass123'), M);
await assert.rejects(C.decryptSecret(box, 'wrong'));
console.log('ВСЕ ТЕСТЫ ПРОЙДЕНЫ');
