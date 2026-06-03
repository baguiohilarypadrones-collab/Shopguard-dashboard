// ================================

// SHOPGUARD CONTENT SCRIPT

// ================================

console.log("ShopGuard content script loaded");

// ================================

// DETECT PLATFORM

// ================================

function getPlatform() {

  if (location.hostname.includes("shopee")) return "Shopee";

  if (location.hostname.includes("lazada")) return "Lazada";

  return "Unknown";

}

// ================================

// CLEAN PRICE

// ================================

function cleanPrice(priceText) {

  if (!priceText) return 0;

  const cleaned = priceText

    .replace(/[₱,\s]/g, "")

    .replace(/[^\d.]/g, "");

  const value = parseFloat(cleaned);

  return isNaN(value) ? 0 : value;

}

// ================================

// CLEAN RATING

// ================================

function cleanRating(ratingText) {

  if (!ratingText) return 0;

  const value = parseFloat(

    ratingText.replace(/[^\d.]/g, "")

  );

  return isNaN(value) ? 0 : value;

}

// ================================

// CHECK SELLER STATUS FROM API

// ================================

async function checkSellerStatus(sellerName) {

  try {

    const res = await fetch(

      `http://localhost:5000/api/sellers/check/${encodeURIComponent(sellerName)}`

    );

    const data = await res.json();

    return data.status || "unknown";

  } catch (err) {

    return "unknown";

  }
}

// ================================

// GET SHOPEE PRODUCT

// ================================

async function getShopeeProduct() {

    // NAME

    const name = document.querySelector(".VCNVHn")?.textContent?.trim() 

                 || document.querySelector(".qaNIZv")?.textContent?.trim() 

                 || document.querySelector("h1")?.textContent?.trim() 

                 || "Unknown Product";

    // ==================== PRICE DETECTION ====================

    let price = 0;

    let originalPrice = 0;

    // FIXED: Target the exact div class shown in your screenshot

    let priceEl = document.querySelector(".IZPeQz.B670Q0") 

               || document.querySelector(".IZPeQz") 

               || document.querySelector(".B670Q0")

               || document.querySelector("div[class*='IZPeQz']")

               || document.querySelector(".IZPeQ.B670Q0"); // fallback for possible class variation

    if (priceEl) {

        const text = priceEl.textContent?.trim() || "";

        console.log("Price element found:", text);

        

        if (text.includes("₱")) {

            price = cleanPrice(text);

        }

    }

    // General fallback (kept unchanged as backup)

    if (!price) {

        const priceSelectors = [

            "div[class*='price']",

            "span[class*='price']",

            ".pqTWkA",

            "._3c9f6o",

            "[class*='product-price']"

        ];

        for (const selector of priceSelectors) {

            const els = document.querySelectorAll(selector);

            for (const el of els) {

                const text = el.textContent?.trim() || "";

                if (text.includes("₱")) {

                    const num = cleanPrice(text);

                    if (num > 10 && num < 1000000) {

                        if (el.style.textDecoration?.includes("line-through") || el.closest("del")) {

                            originalPrice = num;

                        } else if (!price) {

                            price = num;

                        }

                    }

                }

            }

        }

    }

    // Last fallback (unchanged)

    if (!price) {

        const allEls = document.querySelectorAll("div, span");

        for (const el of allEls) {

            const text = el.textContent?.trim() || "";

            if (text.includes("₱") && text.length < 30) {

                const num = cleanPrice(text);

                if (num > 10 && num < 1000000) {

                    price = num;

                    break;

                }

            }

        }

    }

    // ==================== RATING (unchanged) ====================

    let rating = 0;

    const ratingSelectors = [".shopee-rating", "._1cT8t3", "span[class*='rating']", "div[class*='rating']"];

    for (const selector of ratingSelectors) {

        const el = document.querySelector(selector);

        if (el) {

            const text = el.textContent?.trim() || "";

            const match = text.match(/(\d\.\d)/);

            if (match) {

                rating = parseFloat(match[1]);

                break;

            }

        }

    }

    if (!rating) {

        const ratingEl = Array.from(document.querySelectorAll("span, div")).find(el => {

            const t = el.textContent?.trim();

            return /^\d\.\d$/.test(t) && parseFloat(t) >= 1 && parseFloat(t) <= 5;

        });

        if (ratingEl) rating = cleanRating(ratingEl.textContent);

    }

    // ==================== SELLER (unchanged) ====================

    let seller = "";

    let sellerEl = document.querySelector(".fV3TIn") || document.querySelector(".FV3TIn") || document.querySelector("div[class*='V3TIn']");

    if (sellerEl) {

        seller = sellerEl.textContent?.trim() || "";

        console.log("Seller element found:", seller);

    }

    if (!seller || seller.length < 3) {

        const sellerSelectors = [".UWctNB", "._6HeM6T", "a[href*='shop']", ".seller-name", "[class*='seller']", "div[class*='shop-name']"];

        for (const selector of sellerSelectors) {

            const el = document.querySelector(selector);

            if (el) {

                const text = el.textContent?.trim();

                if (text && text.length > 3 && text.length < 60 && !text.toLowerCase().includes("shopee") && !text.toLowerCase().includes("official")) {

                    seller = text;

                    break;

                }

            }

        }

    }

    // IMAGE (unchanged)

    let image = "";

    const imageSelectors = [

        "img[alt*='product']",

        "img[alt*='Product']",

        ".product-image img",

        ".gallery img",

        "div[class*='gallery'] img",

        "img[width][height]"

    ];

    for (const selector of imageSelectors) {

        const img = document.querySelector(selector);

        if (img && img.src && !img.src.includes("logo") && !img.src.includes("icon")) {

            image = img.src;

            break;

        }

    }

    if (!image) {

        const mainImg = document.querySelector("img");

        if (mainImg) image = mainImg.src;

    }

    // REVIEWS (unchanged)

    let reviews = 0;

    const reviewMatch = document.body.innerText.match(/(\d+[,\d]*)\s*Ratings?/i);

    if (reviewMatch) reviews = parseInt(reviewMatch[1].replace(/,/g, "")) || 0;

// ✅ CHECK SELLER STATUS

  const sellerStatus =

    await checkSellerStatus(seller);

    return {

        name,

        price: Number(price.toFixed(2)),

        originalPrice: Number((originalPrice || price).toFixed(2)),

        image,

        category: "Unknown",

        platform: "Shopee",

        rating,

        reviews,

        status: "verified",

        inStock: true,

        url: location.href,

        sellerName: seller || "Unknown Seller",

        sellerId: (seller || "unknown").toLowerCase().replace(/\s/g, "_"),

        sellerStatus

    };

}

// ================================

// GET LAZADA PRODUCT

// ================================

async function getLazadaProduct() {

  // =========================

  // NAME

  // =========================

  const name =

    document.querySelector("h1")?.textContent?.trim() ||

    document.querySelector(".pdp-mod-product-badge-title")?.textContent?.trim() ||

    "";

  // =========================

  // PRICE

  // =========================

  let price = "";

  const allText =

    document.body.innerText || "";

  const priceMatch =

    allText.match(/₱\s?([\d,]+\.\d{2})/) ||

    allText.match(/₱\s?([\d,]+)/);

  if (priceMatch) {

    price = priceMatch[1];

  }

  // =========================

  // RATING

  // =========================

  let rating = 0;

  const ratingMatch =

    allText.match(/(\d\.\d)\s*\(\d+/);

  if (ratingMatch) {

    rating =

      parseFloat(

        ratingMatch[1]

      ) || 0;

  }

  // =========================

// REVIEWS

// =========================

let reviews = 0;

// Try text-based patterns first

const reviewPatterns = [

  /([\d,.]+)\s*Ratings/i,

  /([\d,.]+)\s*reviews/i,

  /\(([\d,.]+)\)/,

  /([\d,.]+)\s*rating/i

];

for (const pattern of reviewPatterns) {

  const match =

    allText.match(pattern);

  if (match) {

    let value =

      match[1]

        .toLowerCase()

        .replace(/,/g, "");

    // handle 1.2k format

    if (value.includes("k")) {

      reviews =

        Math.round(

          parseFloat(value) * 1000

        );

    } else {

      reviews =

        parseInt(value) || 0;

    }

    if (reviews > 0) {

      break;

    }

  }

}

// fallback: scan spans/divs

if (reviews === 0) {

  const elements =

    [...document.querySelectorAll("span, div")];

  for (const el of elements) {

    const text =

      el.textContent?.trim() || "";

    if (

      text.toLowerCase().includes("ratings")

    ) {

      const match =

        text.match(/([\d,.kK]+)/);

      if (match) {

        let value =

          match[1]

            .toLowerCase()

            .replace(/,/g, "");

        if (value.includes("k")) {

          reviews =

            Math.round(

              parseFloat(value) * 1000

            );

        } else {

          reviews =

            parseInt(value) || 0;

        }

        break;

      }

    }

  }

}

  // =========================

  // SELLER

  // =========================

  let seller = "";

  const sellerSelectors = [

    '[data-spm="seller"] a',

    '.seller-name a',

    '.pdp-seller-name a',

    '.seller-link',

    'a[href*="shop"]'

  ];

  for (const selector of sellerSelectors) {

    const elements =

      [...document.querySelectorAll(selector)];

    const valid =

      elements.find(el => {

        const text =

          el.textContent?.trim() || "";

        const lower =

          text.toLowerCase();

        return (

          text.length > 2 &&

          text.length < 60 &&

          !lower.includes("heating") &&

          !lower.includes("cooling") &&

          !lower.includes("ventilation") &&

          !lower.includes("home appliances") &&

          !lower.includes("categories") &&

          !lower.includes("customer care") &&

          !lower.includes("track my order") &&

          !lower.includes("feedback") &&

          !lower.includes("ratings") &&

          !lower.includes("reviews") &&

          !lower.includes("lazada")

        );

      });

    if (valid) {

      seller = valid.textContent

  .trim()

  .toLowerCase()

  .replace(/\u200B/g, "")

  .replace(/\s+/g, "");

      break;

    }

  }

  if (!seller) {

  seller = "unknownseller";

}

  // =========================

  // IMAGE

  // =========================

  let image = "";

  const img =

    document.querySelector("img.pdp-mod-common-image") ||

    document.querySelector(".gallery-preview-panel__content img") ||

    document.querySelector("img");

  if (img) {

    image =

      img.src ||

      img.getAttribute("src") ||

      "";

  }

  // =========================

  // LAZMALL CHECK

  // =========================

  const isLazMall =

    document.body.innerText

      .toLowerCase()

      .includes("lazmall");

  // =========================

  // STATUS

  // =========================

  let status = "verified";

  if (isLazMall) {

    status = "verified";

  } else if (

    rating > 0 &&

    rating < 2.5 &&

    reviews < 3

  ) {

    status = "bogus";

  }

const normalizedSeller = seller

  .trim()

  .toLowerCase()

  .replace(/\u200B/g, "")

  .replace(/\s+/g, "");

const sellerStatus = await checkSellerStatus(normalizedSeller);

console.log("Lazada seller:", normalizedSeller);

console.log("Seller status from API:", sellerStatus);

  // =========================

  // RETURN

  // =========================

  return {

  name,

  price: Number(cleanPrice(price).toFixed(2)),

  originalPrice: Number(cleanPrice(price).toFixed(2)),

  image,

  category: "Unknown",

  platform: "Lazada",

  rating,

  reviews: reviews || 0,

  status,

  inStock: true,

  url: location.href,

  sellerName: normalizedSeller,

  sellerId: normalizedSeller.replace(/\s/g, "_"),

  sellerStatus

};

}

// ================================

// MAIN SCANNER

// ================================

async function scanProduct() {

  const platform =

    getPlatform();

  let product = null;

  if (platform === "Shopee") {

    product = await getShopeeProduct();

  }

  if (platform === "Lazada") {

    product = await getLazadaProduct();

  }

 if (!product) {
  console.error("Unsupported platform");
  return null;
}

if (product.sellerStatus === "blocked") {
  product.status = "blocked";
}
return product;
}

// ================================
// MESSAGE LISTENER
// ================================

chrome.runtime.onMessage.addListener(
  (message, sender, sendResponse) => {

    if (message.action === "SCAN_PRODUCT") {

      scanProduct()
        .then(product => {
          if (product) {
            sendResponse({
              success: true,
              product
            });
          } else {
            sendResponse({
              success: false
            });
          }
        })
        .catch(err => {
          sendResponse({
            success: false,
            error: err.message
          });
        });

      return true;
    }

  }
);

// ================================

// PAGE DETECTOR

// ================================

function isProductPage() {

  return (

    location.href.includes("/product/") ||

    location.href.includes("-i.") ||

    location.href.includes("/products/")

  );

}

if (isProductPage()) {

  console.log("ShopGuard detected product page");

}