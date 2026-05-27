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
// SHOW PRODUCT
// ================================

function showProduct(product) {

  resultBox.innerHTML = `
  
    <div style="
      margin-top:12px;
      padding:12px;
      background:#1e293b;
      border-radius:10px;
      color:white;
    ">

      <img
        src="${product.image}"
        style="
          width:100%;
          height:180px;
          object-fit:cover;
          border-radius:8px;
          margin-bottom:10px;
        "
      />

      <h3 style="
        margin:0;
        font-size:16px;
      ">
        ${product.name}
      </h3>

      <p style="
        margin:8px 0;
        color:#94a3b8;
      ">
        ${product.platform}
      </p>

      <p style="
        margin:8px 0;
      ">
        <strong>Price:</strong>
        ₱${Number(product.price).toFixed(2)}
      </p>

      <p style="
        margin:8px 0;
      ">
        <strong>Seller:</strong>
        ${product.sellerName}
      </p>

      <p style="
        margin:8px 0;
      ">
        <strong>Rating:</strong>
        ${product.rating}
      </p>

      <p style="
        margin:8px 0;
      ">
        <strong>Status:</strong>

        <span style="
          color:${product.status === "bogus"
            ? "#ef4444"
            : "#22c55e"};
          font-weight:bold;
        ">
          ${product.status.toUpperCase()}
        </span>
      </p>

      <button
        id="saveBtn"
        style="
          width:100%;
          padding:10px;
          border:none;
          border-radius:8px;
          background:#06b6d4;
          color:white;
          cursor:pointer;
          margin-top:10px;
        "
      >
        Save Product
      </button>

    </div>
  `;

  // SAVE BUTTON
  document
    .getElementById("saveBtn")
    .addEventListener("click", () => {

      saveProduct(product);
    });
}

// ================================
// SAVE PRODUCT
// ================================

async function saveProduct(product) {

  try {

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

    // GET ACTIVE TAB
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

    if (!tab.id) {

      setStatus(
        "No active tab found",
        "#ef4444"
      );

      return;
    }

    // SEND MESSAGE TO CONTENT SCRIPT
    chrome.tabs.sendMessage(
      tab.id,
      {
        action: "SCAN_PRODUCT"
      },
      (response) => {

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

          setStatus(
            "Scan complete",
            "#22c55e"
          );

          showProduct(response.product);

        } else {

          setStatus(
            "Product scan failed",
            "#ef4444"
          );
        }
      }
    );

  } catch (err) {

    console.error(err);

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