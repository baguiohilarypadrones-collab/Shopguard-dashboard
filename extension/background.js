const API_BASE = "http://localhost:5000/api";

chrome.runtime.onInstalled.addListener(async () => {
  const defaults = {
    enabled: true,
    darkPatternDetection: true,
    sellerWarnings: true,
    priceScanner: true,
    dashboardUrl: "http://localhost:5173",
  };

  const current = await chrome.storage.local.get(Object.keys(defaults));
  await chrome.storage.local.set({ ...defaults, ...current });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "GET_SETTINGS") {
    chrome.storage.local.get(null).then(sendResponse);
    return true;
  }

  if (message.type === "SAVE_SETTINGS") {
    chrome.storage.local.set(message.payload).then(() => sendResponse({ ok: true }));
    return true;
  }

  if (message.type === "FETCH_SELLERS") {
    fetch(`${API_BASE}/sellers`)
      .then((response) => response.json())
      .then((sellers) => sendResponse({ ok: true, sellers }))
      .catch(() => sendResponse({ ok: false, sellers: [] }));
    return true;
  }

  if (message.type === "CHECK_SELLER") {
    const params = new URLSearchParams({
      name: message.payload?.name || "",
      sellerId: message.payload?.sellerId || "",
    });

    fetch(`${API_BASE}/sellers/check?${params.toString()}`)
      .then((response) => response.json())
      .then((result) => sendResponse({ ok: true, result }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  // NEW: ADD_TO_DATABASE handler for direct product insertion
  if (message.type === "ADD_TO_DATABASE") {
    fetch(`${API_BASE}/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message.product),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        return res.json();
      })
      .then((data) => {
        console.log("Successfully saved to MongoDB:", data);
        sendResponse({ success: true, data: data });
      })
      .catch((err) => {
        console.error("Error saving to MongoDB:", err);
        sendResponse({ success: false, error: err.message });
      });
    return true; // Keep channel open for async
  }

  // Existing handler: sends both seller and product data
  if (message.type === "ADD_SCANNED_ITEM") {
    const payload = message.payload || {};

    Promise.all([
      fetch(`${API_BASE}/sellers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload.seller),
      }).then((response) => {
        if (!response.ok) throw new Error(`Seller HTTP ${response.status}`);
        return response.json();
      }),
      fetch(`${API_BASE}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload.product),
      }).then((response) => {
        if (!response.ok) throw new Error(`Product HTTP ${response.status}`);
        return response.json();
      }),
    ])
      .then(([seller, product]) => sendResponse({ ok: true, seller, product }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "DELETE_SCANNED_ITEM") {
    const productId = message.payload?.productId;

    if (!productId) {
      chrome.storage.local.remove(["lastScan", "lastAddedProductId"]).then(() => sendResponse({ ok: true }));
      return true;
    }

    fetch(`${API_BASE}/products/${productId}`, { method: "DELETE" })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((result) => {
        chrome.storage.local.remove(["lastScan", "lastAddedProductId"]).then(() =>
          sendResponse({ ok: true, result })
        );
      })
      .catch((error) => sendResponse({ ok: false, error: error.message }));

    return true;
  }

  if (message.type === "OPEN_DASHBOARD") {
    chrome.storage.local.get("dashboardUrl").then(({ dashboardUrl }) => {
      chrome.tabs.create({ url: dashboardUrl || "http://localhost:5173" });
      sendResponse({ ok: true });
    });
    return true;
  }

  return false;
});