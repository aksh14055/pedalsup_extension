// src/wallet.js

import { Wallet, JsonRpcProvider } from "ethers";

export function createWallet() {
  return Wallet.createRandom();
}

export function importWalletFromKey(key) {
  return new Wallet(key);
}

export async function signTx(wallet, tx, rpcUrl) {
  const provider = new JsonRpcProvider(rpcUrl);
  return await wallet.connect(provider).signTransaction(tx);
}
