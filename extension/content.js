// ================================
// SHOPGUARD CONTENT SCRIPT
// content.js
// ================================

console.log("ShopGuard content script loaded");

// ================================
// DETECT PLATFORM
// ================================

function getPlatform() {

  if (location.hostname.includes("shopee")) {
    return "Shopee";
  }

  if (location.hostname.includes("lazada")) {
    return "Lazada";
  }

  return "Unknown";
}

// ================================
// CLEAN PRICE
// ================================

function cleanPrice(priceText) {

  if (!priceText) return 0;

  const cleaned =
    priceText
      .replace(/[₱,\s]/g, "")
      .replace(/[^\d.]/g, "");

  const value =
    parseFloat(cleaned);

  return isNaN(value)
    ? 0
    : value;
}

// ================================
// CLEAN RATING
// ================================

function cleanRating(ratingText) {

  if (!ratingText) return 0;

  const value =
    parseFloat(
      ratingText.replace(/[^\d.]/g, "")
    );

  return isNaN(value)
    ? 0
    : value;
}

// ================================
// GET SHOPEE PRODUCT
// ================================

function getShopeeProduct() {

  // Wait-safe helper
  const getText = (selectors) => {
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText.trim()) {
        return el.innerText.trim();
      }
    }
    return "";
  };

  // ================================
  // NAME
  // ================================
  const name = getText([
    "h1",
    '[data-testid="pdp-product-title"]',
    ".VCNVHn",
    ".qaNIZv"
  ]);

  // ================================
  // PRICE (avoid shipping price)
  // ================================
  let price = 0;

  const priceContainer = document.querySelectorAll("span");

  priceContainer.forEach(el => {
    const text = el.innerText.trim();

    if (
      text.startsWith("₱") &&
      text.length < 20 &&                // avoid long promo strings
      !text.toLowerCase().includes("off") &&
      !text.toLowerCase().includes("shipping")
    ) {
      const value = parseFloat(text.replace(/[₱,]/g, ""));
      if (value > price) {               // pick highest realistic price
        price = value;
      }
    }
  });

  // ================================
  // SELLER (real seller only)
  // ================================
  let seller = "";

  const sellerLinks = document.querySelectorAll("a[href*='shop']");

  sellerLinks.forEach(link => {
    const text = link.innerText.trim();
    if (
      text &&
      text.length > 2 &&
      !text.toLowerCase().includes("seller centre") &&
      !text.toLowerCase().includes("chat now") &&
      !text.toLowerCase().includes("visit")
    ) {
      seller = text;
    }
  });

  // ================================
  // RATING
  // ================================
  let rating = 0;

  const ratingMatch = document.body.innerText.match(/\b([1-5]\.\d)\b/);
  if (ratingMatch) {
    const val = parseFloat(ratingMatch[1]);
    if (val >= 1 && val <= 5) {
      rating = val;
    }
  }

  // ================================
  // REVIEWS
  // ================================
  let reviews = 0;

  const reviewMatch = document.body.innerText.match(/([\d,]+)\s*Ratings/i);
  if (reviewMatch) {
    reviews = parseInt(reviewMatch[1].replace(/,/g, "")) || 0;
  }

  // ================================
  // IMAGE (Shopee lazy loads via data-src)
  // ================================
  let image = "";

  const images = document.querySelectorAll("img");

  images.forEach(img => {
    const src =
      img.getAttribute("src") ||
      img.getAttribute("data-src") ||
      img.getAttribute("data-lazy-src");

    if (
      src &&
      src.startsWith("http") &&
      !src.includes("avatar") &&
      !src.includes("icon")
    ) {
      image = src;
    }
  });

  // ================================
  // AUTO BOGUS DETECTION
  // ================================
  let status = "verified";

  if (rating > 0 && rating < 2.5) status = "bogus";
  if (reviews > 0 && reviews < 5) status = "bogus";

  return {
    name,
    price: price || 0,
    originalPrice: price || 0,
    image,
    category: "Unknown",
    platform: "Shopee",
    rating,
    reviews,
    status,
    inStock: true,
    url: location.href,
    sellerName: seller || "Unknown Seller",
    sellerId: (seller || "unknown")
      .toLowerCase()
      .replace(/\s/g, "_")
  };
}


// ================================
// GET LAZADA PRODUCT
// ================================

function getLazadaProduct() {

  // NAME
  const name =
    document.querySelector("h1")?.textContent?.trim() ||

    "";

  // ================================
  // PRICE
  // ================================

  let price = "";

  const priceSelectors = [

    ".pdp-price",

    ".notranslate",

    '[class*="price"]',

    '[class*="Price"]'
  ];

  for (const selector of priceSelectors) {

    const elements =
      document.querySelectorAll(selector);

    for (const el of elements) {

      const text =
        el.textContent?.trim() || "";

      const match =
        text.match(/₱\s?(\d+[.,]?\d*)/);

      if (match) {

        const value =
          parseFloat(
            match[1]
              .replace(/,/g, "")
          );

        // IGNORE HUGE PRICES
        if (
          value > 0 &&
          value < 5000
        ) {

          price =
            `₱${value.toFixed(2)}`;

          break;
        }
      }
    }

    if (price) break;
  }

  // ================================
  // RATING
  // ================================

  let rating = "";

  const allElements =
    document.querySelectorAll("span, div");

  allElements.forEach(el => {

    const text =
      el.textContent?.trim() || "";

    if (
      /^\d\.\d$/.test(text)
    ) {

      const num =
        parseFloat(text);

      if (
        num >= 1 &&
        num <= 5
      ) {

        if (!rating) {
          rating = text;
        }
      }
    }
  });

  // ================================
  // SELLER
  // ================================

  let seller = "";

  const sellerElements =
    document.querySelectorAll("a, span, div");

  sellerElements.forEach(el => {

    const text =
      el.textContent?.trim() || "";

    const blocked = [

      "GO TO STORE",

      "SELL ON LAZADA",

      "MEN'S SPORTS CLOTHING",

      "CHAT NOW",

      "FOLLOW"
    ];

    if (
      blocked.includes(
        text.toUpperCase()
      )
    ) {
      return;
    }

    if (
      text.length > 2 &&
      text.length < 25
    ) {

      const parent =
        el.parentElement?.innerText || "";

      if (
        parent.includes("Seller") ||

        parent.includes("sold by") ||

        parent.includes("Visit Store")
      ) {

        if (!seller) {
          seller = text;
        }
      }
    }
  });

  // IMAGE
  const image =
    document.querySelector(
      ".gallery-preview-panel__image img"
    )?.src ||

    document.querySelector("img")?.src ||

    "";

  // REVIEWS
  let reviews = 0;

  const reviewMatch =
    document.body.innerText.match(
      /(\d+[,\d]*)\s*Ratings/i
    );

  if (reviewMatch) {

    reviews =
      parseInt(
        reviewMatch[1]
          .replace(/,/g, "")
      ) || 0;
  }

  // RETURN
  return {

    name,

    price: Number(
      cleanPrice(price).toFixed(2)
    ),

    originalPrice: Number(
      cleanPrice(price).toFixed(2)
    ),

    image,

    category: "Unknown",

    platform: "Lazada",

    rating: cleanRating(rating),

    reviews,

    status: "verified",

    inStock: true,

    url: location.href,

    sellerName:
      seller || "Unknown Seller",

    sellerId:
      (seller || "unknown")
        .toLowerCase()
        .replace(/\s/g, "_")
  };
}

// ================================
// MAIN SCANNER
// ================================

function scanProduct() {

  const platform =
    getPlatform();

  let product = null;

  if (platform === "Shopee") {

    product =
      getShopeeProduct();
  }

  if (platform === "Lazada") {

    product =
      getLazadaProduct();
  }

  if (!product) {

    console.error(
      "Unsupported platform"
    );

    return null;
  }

  // ================================
  // BOGUS DETECTION
  // ================================

  if (
    product.rating > 0 &&
    product.rating < 2.5
  ) {

    product.status =
      "bogus";
  }

  if (
    product.reviews > 0 &&
    product.reviews < 5
  ) {

    product.status =
      "bogus";
  }

  const suspiciousWords = [

    "flashsale",

    "quickdeal",

    "cheapshop",

    "freeshipping",

    "limiteddeal",

    "supercheap"
  ];

  if (product.sellerName) {

    const seller =
      product.sellerName
        .toLowerCase();

    const suspicious =
      suspiciousWords.some(
        word =>
          seller.includes(word)
      );

    if (suspicious) {

      product.status =
        "bogus";
    }
  }

  return product;
}

// ================================
// SAVE TO DATABASE
// ================================

async function saveProduct(product) {

  try {

    const response =
      await fetch(
        "http://localhost:5000/api/products",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify(product)
        }
      );

    const result =
      await response.json();

    console.log(
      "Saved:",
      result
    );

    return result;

  } catch (err) {

    console.error(
      "Save failed:",
      err
    );

    return null;
  }
}

// ================================
// SHOW POPUP
// ================================

function showPopup(product) {

  const existing =
    document.getElementById(
      "shopguard-popup"
    );

  if (existing) {
    existing.remove();
  }

  const popup =
    document.createElement("div");

  popup.id =
    "shopguard-popup";

  popup.style.position =
    "fixed";

  popup.style.top =
    "20px";

  popup.style.right =
    "20px";

  popup.style.width =
    "320px";

  popup.style.background =
    "#0f172a";

  popup.style.color =
    "white";

  popup.style.padding =
    "16px";

  popup.style.borderRadius =
    "12px";

  popup.style.boxShadow =
    "0 0 20px rgba(0,0,0,0.4)";

  popup.style.zIndex =
    "999999";

  popup.style.fontFamily =
    "Arial";

  popup.style.border =
    "1px solid #334155";

  popup.innerHTML = `

    <h2 style="
      margin:0 0 10px 0;
      color:#06b6d4;
    ">
      ShopGuard Scan
    </h2>

    <img
      src="${product.image}"
      style="
        width:100%;
        height:180px;
        object-fit:cover;
        border-radius:8px;
        margin-bottom:12px;
      "
    />

    <p>
      <strong>Name:</strong>
      ${product.name}
    </p>

    <p>
      <strong>Price:</strong>
      ₱${product.price.toFixed(2)}
    </p>

    <p>
      <strong>Seller:</strong>
      ${product.sellerName}
    </p>

    <p>
      <strong>Rating:</strong>
      ${product.rating}
    </p>

    <p>
      <strong>Reviews:</strong>
      ${product.reviews}
    </p>

    <p>
      <strong>Platform:</strong>
      ${product.platform}
    </p>

    <p>
      <strong>Status:</strong>

      <span style="
        color:${
          product.status === "bogus"
            ? "#ef4444"
            : "#22c55e"
        };
        font-weight:bold;
      ">
        ${product.status.toUpperCase()}
      </span>
    </p>

    <button
      id="shopguard-save-btn"
      style="
        width:100%;
        margin-top:12px;
        padding:10px;
        border:none;
        border-radius:8px;
        background:#06b6d4;
        color:white;
        cursor:pointer;
      "
    >
      Save Product
    </button>

    <button
      id="shopguard-close-btn"
      style="
        width:100%;
        margin-top:8px;
        padding:10px;
        border:none;
        border-radius:8px;
        background:#334155;
        color:white;
        cursor:pointer;
      "
    >
      Close
    </button>
  `;

  document.body.appendChild(
    popup
  );

  // CLOSE
  document
    .getElementById(
      "shopguard-close-btn"
    )
    .addEventListener(
      "click",
      () => {

        popup.remove();
      }
    );

  // SAVE
  document
    .getElementById(
      "shopguard-save-btn"
    )
    .addEventListener(
      "click",
      async () => {

        const result =
          await saveProduct(
            product
          );

        if (result) {

          alert(
            "Product saved to ShopGuard"
          );

        } else {

          alert(
            "Save failed"
          );
        }
      }
    );
}

// ================================
// MESSAGE LISTENER
// ================================

chrome.runtime.onMessage.addListener(
  (
    message,
    sender,
    sendResponse
  ) => {

    if (
      message.action ===
      "SCAN_PRODUCT"
    ) {

      try {

        const product =
          scanProduct();

        console.log(
          "SCANNED PRODUCT:",
          product
        );

        if (product) {

          showPopup(product);

          sendResponse({

            success: true,

            product
          });

        } else {

          sendResponse({

            success: false
          });
        }

      } catch (err) {

        console.error(err);

        sendResponse({

          success: false,

          error: err.message
        });
      }
    }

    return true;
  }
);

// ================================
// PAGE DETECTOR
// ================================

function isProductPage() {

  return (

    location.href.includes(
      "/product/"
    ) ||

    location.href.includes(
      "-i."
    ) ||

    location.href.includes(
      "/products/"
    )
  );
}

// ================================
// AUTO LOG
// ================================

if (isProductPage()) {

  console.log(
    "ShopGuard detected product page"
  );
}