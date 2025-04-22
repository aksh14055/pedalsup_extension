const PROJECT_ID = '67e988920022b56efa1e';
const DATABASE_ID = '67e988e1002f34f6fb39';
const WALLET_COLLECTION_ID = '67e98a040038b55fd537';
const TX_COLLECTION_ID = '67e9b89e0029ba82a3ac';
const API_KEY = 'standard_09fad189b2e3682c2c9ccbf98ab3ec289b09bedbf079db5fc6be1a668027e0b1c7bf8997583e28f187be37546a371b4c491d9e7303c877a8b0cabde35771738da14429d76a2f391c16c51abceddc7cf1ea709fbbe5d0342af11e6c56f9ecdb52241d322a7df10a4576b98f49f6ab276bff9a3b07892dac195cf9d84a298c5e25';

export const saveWalletToAppwrite = async (address, balance) => {
  console.log("🛰 Saving wallet to Appwrite:", { address, balance });

  try {
    const response = await fetch(
      `https://cloud.appwrite.io/v1/databases/${DATABASE_ID}/collections/${WALLET_COLLECTION_ID}/documents`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Appwrite-Project": PROJECT_ID,
          "X-Appwrite-Key": API_KEY
        },
        body: JSON.stringify({
          documentId: "unique()",
          data: {
            address,
            balance,
            lastUpdated: new Date().toISOString()
          }
        })
      }
    );

    const json = await response.json();
    if (!response.ok) throw new Error(json.message || "Unknown error");

    console.log("✅ Wallet saved to Appwrite:", json.$id);
  } catch (err) {
    console.error("❌ Wallet Save Error:", err.message);
    console.error("📛 Full Error Object:", err);
  }
};

export const saveTransactionToAppwrite = async ({ from, to, amount, txHash, timestamp }) => {
  console.log("💾 Logging TX to Appwrite:", { from, to, amount, txHash, timestamp });

  try {
    const response = await fetch(
      `https://cloud.appwrite.io/v1/databases/${DATABASE_ID}/collections/${TX_COLLECTION_ID}/documents`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Appwrite-Project": PROJECT_ID,
          "X-Appwrite-Key": API_KEY
        },
        body: JSON.stringify({
          documentId: "unique()",
          data: {
            from,
            to,
            amount,
            txHash,
            timestamp
          }
        })
      }
    );

    const json = await response.json();
    if (!response.ok) throw new Error(json.message || "Unknown error");

    console.log("✅ TX logged to Appwrite:", json.$id);
  } catch (err) {
    console.error("❌ TX log error:", err.message);
    console.error("📛 Full Error Object:", err);
  }
};

export const fetchTransactions = async (walletAddress) => {
  try {
    const response = await fetch(
      `https://cloud.appwrite.io/v1/databases/${DATABASE_ID}/collections/${TX_COLLECTION_ID}/documents`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Appwrite-Project": PROJECT_ID,
          "X-Appwrite-Key": API_KEY
        },
        body: JSON.stringify({
          queries: [
            `equal("from", "${walletAddress}")`,
            `orderDesc("$createdAt")`
          ]
        })
      }
    );

    const json = await response.json();
    if (!response.ok) throw new Error(json.message || "Failed to fetch transactions");

    console.log("📥 TX history fetched:", json.documents.length);
    return json.documents;
  } catch (err) {
    console.error("❌ Fetch TXs Error:", err.message);
    return [];
  }
};

export const fetchBalanceFromAppwrite = async (address) => {
  try {
    const response = await fetch(
      `https://cloud.appwrite.io/v1/databases/${DATABASE_ID}/collections/${WALLET_COLLECTION_ID}/documents`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Appwrite-Project": PROJECT_ID,
          "X-Appwrite-Key": API_KEY
        },
        body: JSON.stringify({
          queries: [
            `equal("address", "${address}")`
          ]
        })
      }
    );

    const json = await response.json();
    if (!response.ok) throw new Error(json.message || "Failed to fetch balance");

    if (json.documents && json.documents.length > 0) {
      return json.documents[0].balance;
    } else {
      return null;
    }
  } catch (err) {
    console.error("❌ Fetch Balance Error:", err.message);
    return null;
  }
};
