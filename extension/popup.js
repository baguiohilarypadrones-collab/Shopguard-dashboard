const controls = [
  "enabled",
  "darkPatternDetection",
  "sellerWarnings",
  "priceScanner",
];

const statusBox =
  document.getElementById("statusBox");

const resultBox =
  document.getElementById("resultBox");

const addButton =
  document.getElementById("addItem");

const deleteButton =
  document.getElementById("deleteItem");

let currentScan = null;

let currentSellerCheck = null;

let addedProductId = null;

function sendMessage(message) {
  return new Promise((resolve) =>
    chrome.runtime.sendMessage(
      message,
      resolve
    )
  );
}

function setStatus(
  message,
  warning = false
) {
  statusBox.textContent = message;

  statusBox.classList.toggle(
    "popup__status--warning",
    warning
  );
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderScan(scan, sellerCheck) {
  const warnings = [
    ...(scan?.warnings || []),
  ];

  if (sellerCheck?.risky) {
    warnings.unshift({
      type: "Bogus seller alert",
      severity: "critical",
      message: sellerCheck.message,
    });
  }

  resultBox.classList.remove(
    "result--empty"
  );

  resultBox.innerHTML = `
    <article class="product-card">
      <img
        src="${escapeHtml(
          scan.product.image
        )}"
        alt="${escapeHtml(
          scan.product.name
        )}"
      />

      <div class="data-grid">

        <div class="data-row">
          <span class="data-label">
            Name
          </span>

          <strong>
            ${escapeHtml(
              scan.product.name
            )}
          </strong>
        </div>

        <div class="data-row">
          <span class="data-label">
            Price
          </span>

          <span>
            ₱${Number(
              scan.product.price || 0
            ).toFixed(2)}
          </span>
        </div>

        <div class="data-row">
          <span class="data-label">
            Rating
          </span>

          <span>
            ${Number(
              scan.product.rating || 0
            ).toFixed(1)}
            (${Number(
              scan.product.reviews || 0
            )} reviews)
          </span>
        </div>

        <div class="data-row">
          <span class="data-label">
            Platform
          </span>

          <span>
            ${escapeHtml(
              scan.product.platform
            )}
          </span>
        </div>

        <div class="data-row">
          <span class="data-label">
            Seller
          </span>

          <span>
            ${escapeHtml(
              scan.seller.name
            )}
          </span>
        </div>

        <div class="data-row">
          <span class="data-label">
            Seller ID
          </span>

          <span>
            ${escapeHtml(
              scan.seller.sellerId
            )}
          </span>
        </div>

        <div class="data-row">
          <span class="data-label">
            Seller Rating
          </span>

          <span>
            ${Number(
              scan.seller.rating || 0
            ).toFixed(1)}
          </span>
        </div>

        <div class="data-row">
          <span class="data-label">
            Products
          </span>

          <span>
            ${Number(
              scan.seller.products || 0
            )}
          </span>
        </div>

      </div>

      <div class="warning-list">
        ${
          warnings.length
            ? warnings
                .map(
                  (warning) => `
                    <div class="warning ${
                      warning.severity ===
                      "critical"
                        ? "warning--critical"
                        : ""
                    }">
                      <strong>
                        ${escapeHtml(
                          warning.type
                        )}:
                      </strong>

                      ${escapeHtml(
                        warning.message
                      )}
                    </div>
                  `
                )
                .join("")
            : `
              <div class="warning">
                <strong>
                  Seller check:
                </strong>

                ${escapeHtml(
                  sellerCheck?.message ||
                    "No warning found."
                )}
              </div>
            `
        }
      </div>
    </article>
  `;

  addButton.disabled = false;

  deleteButton.disabled = false;
}

async function loadSettings() {
  const settings = await sendMessage({
    type: "GET_SETTINGS",
  });

  controls.forEach((id) => {
    const input =
      document.getElementById(id);

    input.checked = Boolean(
      settings[id]
    );

    input.addEventListener(
      "change",
      saveSettings
    );
  });

  const saved =
    await chrome.storage.local.get([
      "lastScan",
      "lastSellerCheck",
      "lastAddedProductId",
    ]);

  currentScan =
    saved.lastScan || null;

  currentSellerCheck =
    saved.lastSellerCheck || null;

  addedProductId =
    saved.lastAddedProductId || null;

  if (currentScan) {
    renderScan(
      currentScan,
      currentSellerCheck
    );

    setStatus(
      addedProductId
        ? "Last scan is already added to the web app."
        : "Last scan loaded. You can add or delete it.",
      currentSellerCheck?.risky
    );
  } else {
    setStatus(
      settings.enabled
        ? "Ready to scan this page."
        : "Extension is disabled. Enable it in settings."
    );
  }
}

async function saveSettings() {
  const payload = {};

  controls.forEach((id) => {
    payload[id] =
      document.getElementById(id)
        .checked;
  });

  await sendMessage({
    type: "SAVE_SETTINGS",
    payload,
  });

  setStatus(
    payload.enabled
      ? "Settings saved. Protection is active."
      : "Settings saved. Protection is disabled."
  );
}

async function scanCurrentPage() {
  setStatus(
    "Scanning current page..."
  );

  addButton.disabled = true;

  deleteButton.disabled = true;

  const [tab] =
    await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

  if (!tab?.id) {
    setStatus(
      "Could not access the current tab.",
      true
    );

    return;
  }

  try {
    await chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        files: ["content.js"],
      }
    );

    const response =
      await chrome.tabs.sendMessage(
        tab.id,
        {
          type: "EXTRACT_SHOPGUARD_PAGE",
        }
      );

    if (!response?.ok) {
      throw new Error("Scan failed");
    }

    currentScan = response.scan;

    const sellerResponse =
      await sendMessage({
        type: "CHECK_SELLER",
        payload: currentScan.seller,
      });

    currentSellerCheck =
      sellerResponse?.ok
        ? sellerResponse.result
        : {
            found: false,
            risky: false,
            message:
              "Backend seller check unavailable.",
          };

    addedProductId = null;

    await chrome.storage.local.set({
      lastScan: currentScan,
      lastSellerCheck:
        currentSellerCheck,
      lastAddedProductId: null,
    });

    await chrome.tabs.sendMessage(
      tab.id,
      {
        type: "SHOW_SHOPGUARD_BANNER",
        payload: {
          scan: currentScan,
          sellerCheck:
            currentSellerCheck,
        },
      }
    );

    renderScan(
      currentScan,
      currentSellerCheck
    );

    setStatus(
      currentSellerCheck.risky
        ? "Warning: seller is risky or bogus."
        : "Scan complete. No bogus seller warning found.",
      currentSellerCheck.risky
    );
  } catch (error) {
    setStatus(
      `Scan failed: ${error.message}. Reload the Lazada/Shopee page and try again.`,
      true
    );
  }
}

async function addCurrentScan() {
  if (!currentScan) return;

  setStatus(
    "Adding product and seller to the web app..."
  );

  const status =
    currentSellerCheck?.risky
      ? "bogus"
      : "verified";

  const payload = {
    seller: {
      ...currentScan.seller,

      status:
        currentSellerCheck?.seller
          ?.status || status,

      reason:
        currentSellerCheck?.seller
          ?.reason ||
        (currentSellerCheck?.risky
          ? currentSellerCheck.message
          : undefined),
    },

    product: {
      ...currentScan.product,

      status,
    },
  };

  const response =
    await sendMessage({
      type: "ADD_SCANNED_ITEM",
      payload,
    });

  if (!response?.ok) {
    setStatus(
      `Add failed: ${
        response?.error ||
        "Backend unavailable"
      }`,
      true
    );

    return;
  }

  addedProductId =
    response.product.id;

  await chrome.storage.local.set({
    lastAddedProductId:
      addedProductId,
  });

  setStatus(
    "Added to the web app. Refresh the dashboard Products/Sellers page to see it."
  );
}

async function deleteCurrentScan() {
  const response =
    await sendMessage({
      type: "DELETE_SCANNED_ITEM",

      payload: {
        productId: addedProductId,
      },
    });

  if (!response?.ok) {
    setStatus(
      `Delete failed: ${
        response?.error ||
        "Could not delete scan"
      }`,
      true
    );

    return;
  }

  currentScan = null;

  currentSellerCheck = null;

  addedProductId = null;

  resultBox.classList.add(
    "result--empty"
  );

  resultBox.innerHTML = `
    <p>
      No scan yet. Open a Lazada or
      Shopee product page and click
      Scan page.
    </p>
  `;

  addButton.disabled = true;

  deleteButton.disabled = true;

  setStatus(
    "Scan deleted from extension storage. If it was added, the product was removed from the database."
  );
}

document
  .getElementById("scanPage")
  .addEventListener(
    "click",
    scanCurrentPage
  );

document
  .getElementById("addItem")
  .addEventListener(
    "click",
    addCurrentScan
  );

document
  .getElementById("deleteItem")
  .addEventListener(
    "click",
    deleteCurrentScan
  );

document
  .getElementById("openDashboard")
  .addEventListener(
    "click",
    () =>
      sendMessage({
        type: "OPEN_DASHBOARD",
      })
  );

loadSettings();