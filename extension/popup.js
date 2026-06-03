// ================================
// SHOPGUARD POPUP SCRIPT
// popup.js
// ================================

console.log("ShopGuard popup loaded");

// ================================
// ELEMENTS
// ================================

const scanBtn = document.getElementById("scanBtn");
const resultBox = document.getElementById("result");
const statusText = document.getElementById("status");

// ================================
// SHOW STATUS
// ================================

function setStatus(text, color = "#06b6d4") {
  statusText.textContent = text;
  statusText.style.color = color;
}

// ================================
// HELPERS
// ================================

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getProductStatusColor(status) {
  return status === "blocked"
    ? "#ef4444"
    : status === "bogus"
      ? "#f59e0b"
      : "#22c55e";
}

function getSellerStatusColor(status) {
  return status === "blocked"
    ? "#ef4444"
    : status === "verified"
      ? "#22c55e"
      : status === "flagged" || status === "bogus"
        ? "#f59e0b"
        : "#94a3b8";
}

function formatStatus(status) {
  return String(status || "unknown").toUpperCase();
}

// ================================
// SHOW PRODUCT
// ================================

function showProduct(product) {
  const productStatus = product.status || "unknown";
  const sellerStatus = product.sellerStatus || "unknown";

  const productStatusColor = getProductStatusColor(productStatus);
  const sellerStatusColor = getSellerStatusColor(sellerStatus);

  const isBlocked =
    productStatus === "blocked" ||
    sellerStatus === "blocked";

  resultBox.innerHTML = `
    <div style="
      margin-top:12px;
      padding:12px;
      background:#1e293b;
      border-radius:10px;
      color:white;
    ">

      ${
        product.image
          ? `
            <img
              src="${escapeHtml(product.image)}"
              style="
                width:100%;
                height:180px;
                object-fit:cover;
                border-radius:8px;
                margin-bottom:10px;
              "
            />
          `
          : `
            <div style="
              width:100%;
              height:120px;
              display:flex;
              align-items:center;
              justify-content:center;
              background:#0f172a;
              border-radius:8px;
              margin-bottom:10px;
              color:#94a3b8;
              font-size:13px;
            ">
              No image found
            </div>
          `
      }

      <h3 style="
        margin:0;
        font-size:16px;
        line-height:1.4;
      ">
        ${escapeHtml(product.name || "Unknown Product")}
      </h3>

      <p style="
        margin:8px 0;
        color:#94a3b8;
      ">
        ${escapeHtml(product.platform || "Unknown Platform")}
      </p>

      <p style="margin:8px 0;">
        <strong>Price:</strong>
        ₱${Number(product.price || 0).toFixed(2)}
      </p>

      <p style="margin:8px 0;">
        <strong>Seller:</strong>
        ${escapeHtml(product.sellerName || "Unknown Seller")}
      </p>

      <p style="margin:8px 0;">
        <strong>Seller Status:</strong>
        <span style="
          color:${sellerStatusColor};
          font-weight:bold;
        ">
          ${formatStatus(sellerStatus)}
        </span>
      </p>

      <p style="margin:8px 0;">
        <strong>Rating:</strong>
        ${product.rating ?? 0}
      </p>

      <p style="margin:8px 0;">
        <strong>Reviews:</strong>
        ${product.reviews || 0}
      </p>

      <p style="margin:8px 0;">
        <strong>Status:</strong>
        <span style="
          color:${productStatusColor};
          font-weight:bold;
        ">
          ${formatStatus(productStatus)}
        </span>
      </p>

      ${
        isBlocked
          ? `
            <div style="
              margin-top:12px;
              padding:10px;
              border-radius:8px;
              background:rgba(239,68,68,0.15);
              border:1px solid rgba(239,68,68,0.4);
              color:#fca5a5;
              font-size:13px;
              line-height:1.4;
            ">
              ⚠️ Warning: This seller is blocked in the ShopGuard database.
              This product has been automatically flagged.
            </div>
          `
          : ""
      }

      <button
        id="saveBtn"
        ${isBlocked ? "disabled" : ""}
        style="
          width:100%;
          padding:10px;
          border:none;
          border-radius:8px;
          background:${isBlocked ? "#475569" : "#06b6d4"};
          color:white;
          cursor:${isBlocked ? "not-allowed" : "pointer"};
          margin-top:12px;
          font-weight:bold;
        "
      >
        ${isBlocked ? "Blocked Seller - Cannot Save" : "Save Product"}
      </button>

    </div>
  `;

  // SAVE BUTTON
  const saveBtn = document.getElementById("saveBtn");

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      saveProduct(product);
    });
  }
}

// ================================
// SAVE PRODUCT
// ================================

async function saveProduct(product) {
  try {
    // Optional safety:
    // Product model currently supports verified/bogus/pending only.
    // So blocked products are stopped here.
    if (
      product.status === "blocked" ||
      product.sellerStatus === "blocked"
    ) {
      setStatus(
        "Blocked seller detected — product not saved",
        "#ef4444"
      );

      return;
    }

    setStatus("Saving product...", "#facc15");

    const response = await fetch(
      "http://localhost:5000/api/products",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify(product)
      }
    );

    const result = await response.json();

    console.log(result);

    if (response.ok) {
      setStatus(
        "Product saved successfully",
        "#22c55e"
      );
    } else {
      setStatus(
        result.error || "Save failed",
        "#ef4444"
      );
    }

  } catch (err) {
    console.error(err);

    setStatus(
      "Server connection failed",
      "#ef4444"
    );
  }
}

// ================================
// SCAN BUTTON
// ================================

scanBtn.addEventListener("click", async () => {
  try {
    setStatus("Scanning product...", "#facc15");

    scanBtn.disabled = true;
    scanBtn.textContent = "Scanning...";

    // GET ACTIVE TAB
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

    if (!tab || typeof tab.id !== "number") {
      setStatus(
        "No active tab found",
        "#ef4444"
      );

      scanBtn.disabled = false;
      scanBtn.textContent = "Scan Current Product";

      return;
    }

    // SEND MESSAGE TO CONTENT SCRIPT
    chrome.tabs.sendMessage(
      tab.id,
      {
        action: "SCAN_PRODUCT"
      },
      (response) => {
        scanBtn.disabled = false;
        scanBtn.textContent = "Scan Current Product";

        // ERROR CHECK
        if (chrome.runtime.lastError) {
          console.error(
            chrome.runtime.lastError
          );

          setStatus(
            "Open a Shopee/Lazada product page first",
            "#ef4444"
          );

          return;
        }

        // NO RESPONSE
        if (!response) {
          setStatus(
            "No response from page",
            "#ef4444"
          );

          return;
        }

        // SUCCESS
        if (response.success) {
          const product = response.product;

          const color = getProductStatusColor(
            product.status
          );

          if (
            product.status === "blocked" ||
            product.sellerStatus === "blocked"
          ) {
            setStatus(
              "Blocked seller detected",
              "#ef4444"
            );
          } else {
            setStatus(
              "Scan complete",
              color
            );
          }

          showProduct(product);

        } else {
          setStatus(
            response.error || "Product scan failed",
            "#ef4444"
          );
        }
      }
    );

  } catch (err) {
    console.error(err);

    scanBtn.disabled = false;
    scanBtn.textContent = "Scan Current Product";

    setStatus(
      "Unexpected error",
      "#ef4444"
    );
  }
});

// ================================
// INITIAL STATUS
// ================================

setStatus(
  "Ready to scan",
  "#06b6d4"
);