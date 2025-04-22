import React, { useEffect, useState } from "react";
import * as ethers from "ethers";
import {
  saveWalletToAppwrite,
  saveTransactionToAppwrite,
  fetchTransactions,
} from "./appwrite.js";
import { createWallet, importWalletFromKey, signTx } from "./wallet.js";

const CHAINS = {
  ethereum: {
    name: "🟡 Ethereum Sepolia",
    rpc: "https://eth-sepolia.g.alchemy.com/v2/7NSxPk10NMRhmAK1_-aBPD5sSuzZj5NQ",
    symbol: "ETH",
  },
  polygon: {
    name: "🟣 Polygon Amoy",
    rpc: "https://polygon-amoy.g.alchemy.com/v2/2-KI7SUIamqqBbRyU_FqhAC2GETvcBUZ",
    symbol: "MATIC",
  },
};

export default function App() {
  const [wallet, setWallet] = useState(null);
  const [balance, setBalance] = useState(null);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [txHistory, setTxHistory] = useState([]);
  const [importKey, setImportKey] = useState("");
  const [selectedChain, setSelectedChain] = useState("ethereum");

  const PROJECT_ID = "67e988920022b56efa1e";
  const API_KEY = "standard_09fad189b2e3682c2c9ccbf98ab3ec289b09bedbf079db5fc6be1a668027e0b1c7bf8997583e28f187be37546a371b4c491d9e7303c877a8b0cabde35771738da14429d76a2f391c16c51abceddc7cf1ea709fbbe5d0342af11e6c56f9ecdb52241d322a7df10a4576b98f49f6ab276bff9a3b07892dac195cf9d84a298c5e25";
  const DB_ID = "67e988e1002f34f6fb39";
  const WALLET_COLL_ID = "67e98a040038b55fd537";

  useEffect(() => {
    const storedKey = localStorage.getItem("ethPrivateKey");
    if (storedKey) {
      const restored = importWalletFromKey(storedKey);
      setWallet(restored);
      exposePedalsUp(restored);
      fetchBalanceFromAppwrite(restored.address).then((appwriteBal) => {
        if (appwriteBal) {
          setBalance(appwriteBal);
        } else {
          fetchBalance(restored.address);
        }
      });
      fetchTransactions(restored.address).then(setTxHistory);
    }
  }, [selectedChain]);

  const exposePedalsUp = (walletInstance) => {
    window.pedalsUp = {
      connect: async () => walletInstance.address,
      getAccounts: async () => [walletInstance.address],
      signTransaction: async (tx) =>
        await signTx(walletInstance, tx, CHAINS[selectedChain].rpc),
    };
  };

  const fetchBalance = async (address) => {
    try {
      const provider = new ethers.JsonRpcProvider(CHAINS[selectedChain].rpc);
      const wei = await provider.getBalance(address);
      const eth = ethers.formatEther(wei);
      setBalance(eth);
      return eth;
    } catch (err) {
      console.error("Error fetching balance:", err);
      setBalance("Error");
      return "Error";
    }
  };

  const fetchBalanceFromAppwrite = async (address) => {
    try {
      const response = await fetch(
        `https://cloud.appwrite.io/v1/databases/${DB_ID}/collections/${WALLET_COLL_ID}/documents`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Appwrite-Project": PROJECT_ID,
            "X-Appwrite-Key": API_KEY,
          },
          body: JSON.stringify({
            queries: [`equal("address", "${address}")`],
          }),
        }
      );

      const data = await response.json();
      if (data.documents?.length > 0) {
        const entry = data.documents[0];
        const perChain = entry.perChain || {};
        const stored = perChain[selectedChain];
        if (stored && stored.balance) {
          setBalance(stored.balance);
        } else {
          fetchBalance(address);
        }
      } else {
        fetchBalance(address);
      }
    } catch (err) {
      console.error("Appwrite balance fetch failed:", err);
      fetchBalance(address);
    }
  };

  const createNewWallet = async () => {
    const newWallet = createWallet();
    setWallet(newWallet);
    exposePedalsUp(newWallet);
    localStorage.setItem("ethPrivateKey", newWallet.privateKey);
    const newBalance = await fetchBalance(newWallet.address);
    saveWalletToAppwrite(newWallet.address, newBalance, selectedChain);
  };

  const importWallet = () => {
    try {
      const imported = importWalletFromKey(importKey);
      setWallet(imported);
      exposePedalsUp(imported);
      localStorage.setItem("ethPrivateKey", importKey);
      fetchBalanceFromAppwrite(imported.address);
      fetchTransactions(imported.address).then(setTxHistory);
      alert("✅ Wallet imported!");
      setImportKey("");
    } catch (err) {
      alert("❌ Invalid private key.");
    }
  };

  const exportKey = () => {
    if (wallet) {
      alert(`Private Key:\n${wallet.privateKey}`);
    }
  };

  const resetWallet = () => {
    if (!window.confirm("This will remove your wallet from localStorage. Proceed?")) return;
    localStorage.removeItem("ethPrivateKey");
    setWallet(null);
    setBalance(null);
    setRecipient("");
    setAmount("");
    setTxHistory([]);
  };

  const sendEth = async () => {
    if (!recipient || !amount) {
      alert("Please enter recipient and amount.");
      return;
    }

    try {
      const fakeHash = "0x" + Math.random().toString(16).slice(2).padEnd(64, "0");
      alert(`✅ Simulated Transaction!\nHash: ${fakeHash}`);
      const updated = (parseFloat(balance) - parseFloat(amount)).toFixed(6);
      setBalance(updated);
      saveTransactionToAppwrite({
        from: wallet.address,
        to: recipient,
        amount,
        txHash: fakeHash,
        timestamp: new Date().toISOString(),
      });
      saveWalletToAppwrite(wallet.address, updated, selectedChain);
      fetchTransactions(wallet.address).then(setTxHistory);
    } catch (err) {
      console.error("❌ Simulated TX failed:", err);
      alert("❌ Transaction failed: " + err.message);
    }
  };

  return (
    <div style={{
      padding: "1.2rem", width: "330px", fontFamily: "system-ui",
      background: "#fefefe", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
    }}>
      <h2 style={{ textAlign: "center" }}>🚴 Pedal's Up</h2>

      <select
        value={selectedChain}
        onChange={(e) => setSelectedChain(e.target.value)}
        style={{ width: "100%", padding: 10, marginBottom: 12, borderRadius: 8 }}
      >
        {Object.entries(CHAINS).map(([key, chain]) => (
          <option key={key} value={key}>{chain.name}</option>
        ))}
      </select>

      {!wallet && (
        <button onClick={createNewWallet} style={{ width: "100%", padding: 12, background: "#000", color: "#fff", borderRadius: 8 }}>
          🆕 Create Wallet
        </button>
      )}

      <div style={{ marginTop: 12 }}>
        <input
          placeholder="Import Private Key"
          value={importKey}
          onChange={(e) => setImportKey(e.target.value)}
          style={{ width: "100%", padding: 10, borderRadius: 8, marginBottom: 6, border: "1px solid #ccc" }}
        />
        <button onClick={importWallet} style={{ width: "100%", padding: 10, background: "#4a90e2", color: "#fff", borderRadius: 8 }}>
          🔑 Import Wallet
        </button>
      </div>

      {wallet && (
        <div>
          <p style={{ marginTop: 16 }}>
            <strong>👛 {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}</strong>
          </p>
          <p>
            💰 Balance: {balance == null ? "Loading..." : `${balance} ${CHAINS[selectedChain].symbol}`}
          </p>

          <div style={{ marginTop: 16 }}>
            <input
              placeholder="Recipient address"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              style={{ width: "100%", marginBottom: 8, padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
            />
            <input
              placeholder={`Amount (${CHAINS[selectedChain].symbol})`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{ width: "100%", marginBottom: 8, padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
            />
            <button
              onClick={sendEth}
              style={{ width: "100%", background: "#4caf50", color: "#fff", padding: 10, borderRadius: 8 }}
            >
              📤 Send {CHAINS[selectedChain].symbol}
            </button>
          </div>

          <button onClick={exportKey} style={{ width: "100%", marginTop: 10, padding: 8 }}>📋 Export Private Key</button>
          <button onClick={resetWallet} style={{ width: "100%", marginTop: 8, background: "#eee", padding: 8, borderRadius: 8 }}>
            ❌ Reset Wallet
          </button>

          {txHistory.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <strong>📜 Transaction History:</strong>
              <ul style={{ padding: 0, listStyle: "none", fontSize: "0.85rem", marginTop: 8 }}>
                {txHistory.map((tx) => (
                  <li key={tx.$id} style={{ marginBottom: 10, background: "#f1f1f1", padding: 8, borderRadius: 6 }}>
                    → {tx.to.slice(0, 6)}...{tx.to.slice(-4)} | {tx.amount} {CHAINS[selectedChain].symbol}
                    <br />
                    <span style={{ color: "#555" }}>
                      {new Date(tx.timestamp).toLocaleString(undefined, {
                        dateStyle: "short", timeStyle: "short",
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
