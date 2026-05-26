(() => {
  if (window.__SHOPGUARD_CONTENT_READY__) return;
  window.__SHOPGUARD_CONTENT_READY__ = true;

  const SHOPGUARD_BANNER_ID = "shopguard-protection-banner";

  const DARK_PATTERN_RULES = [
    {
      label: "Fake urgency language",
      severity: "high",
      pattern: /limited time|hurry|ending soon|last chance|deal expires|today only/i,
    },
    {
      label: "False scarcity wording",
      severity: "medium",
      pattern: /only\s+\d+\s+(left|remaining)|almost sold out|selling fast/i,
    },
    {
      label: "Pressure purchase wording",
      severity: "medium",
      pattern: /\d+\s+people\s+(are\s+)?viewing|\d+\s+sold\s+in\s+the\s+last/i,
    },
    {
      label: "Hidden-fee clue",
      severity: "high",
      pattern: /handling fee|processing fee|service charge|extra fee/i,
    },
    {
      label: "Manipulative opt-out language",
      severity: "low",
      pattern: /no thanks.*save money|i do not want.*discount|miss out/i,
    },
  ];

  function text(selector) {
    const node = document.querySelector(selector);

    return (
      node?.textContent
        ?.replace(/\s+/g, " ")
        .trim() || ""
    );
  }

  function attr(selector, attribute) {
    const node = document.querySelector(selector);

    return node?.getAttribute(attribute) || "";
  }

  function firstUsefulText(selectors) {
    for (const selector of selectors) {
      const value = text(selector);

      if (
        value &&
        value.length >= 2 &&
        value.length <= 240
      ) {
        return value;
      }
    }

    return "";
  }

  function firstImage(selectors) {
    for (const selector of selectors) {
      const value =
        attr(selector, "src") ||
        attr(selector, "data-src") ||
        attr(selector, "data-img");

      if (value && !value.startsWith("data:")) {
        return value.startsWith("//")
          ? `https:${value}`
          : value;
      }
    }

    const ogImage = attr(
      'meta[property="og:image"]',
      "content"
    );

    if (ogImage) return ogImage;

    return "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop";
  }

  function numberFromText(value) {
    if (!value) return 0;

    const match = String(value).match(
      /[0-9]+(?:,[0-9]{3})*(?:\.[0-9]+)?|[0-9]+/
    );

    return match
      ? Number(match[0].replace(/,/g, ""))
      : 0;
  }

  function priceFromText(value) {
    const match = String(value).match(
      /(?:₱|PHP|P\s?)\s?([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?|[0-9]+(?:\.[0-9]{2})?)/i
    );

    return match
      ? Number(match[1].replace(/,/g, ""))
      : 0;
  }

  function decimalFromText(value) {
    if (!value) return 0;

    const match = String(value).match(
      /([0-5](?:\.[0-9])?)/
    );

    return match
      ? Number(match[1])
      : 0;
  }

  function detectPlatform() {
    const host = location.hostname.toLowerCase();

    if (host.includes("shopee")) return "Shopee";

    if (host.includes("lazada")) return "Lazada";

    return "Unknown";
  }

  function getPageText() {
    return (
      document.body?.innerText
        ?.replace(/\s+/g, " ")
        .slice(0, 150000) || ""
    );
  }

  function detectDarkPatterns(pageText) {
    return DARK_PATTERN_RULES
      .filter((rule) => rule.pattern.test(pageText))
      .map((rule) => ({
        type: rule.label,
        severity: rule.severity,
        message:
          `${rule.label} detected. Review the offer carefully before checkout.`,
      }));
  }

  function getMetaProductName() {
    return (
      attr('meta[property="og:title"]', "content") ||
      document.title.replace(/\|.*|-.*/g, "").trim()
    );
  }

  function normalizedSellerId(sellerName) {
    return sellerName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "unknown";
  }

  function extractShopee(pageText) {
    const sellerName =
      text("[class*='shop-name']") ||
      text("[class*='shopName']") ||
      text("a[href*='/shop/']") ||
      text("a[href*='shopid']") ||
      "Unknown seller";

    return {
      name:
        firstUsefulText([
          "h1",
          "[class*='product-briefing'] [class*='title']",
          "[class*='product-title']",
        ]) || getMetaProductName(),

      price: priceFromText(
        firstUsefulText([
          "[class*='pmmxKx']",
          "[class*='price']",
          "[class*='product-price']",
        ]) || pageText
      ),

      rating:
        decimalFromText(
          firstUsefulText([
            "[class*='rating']",
            "[class*='star']",
          ])
        ) ||
        decimalFromText(
          pageText.match(
            /([0-5](?:\.[0-9])?)\s*(?:stars?|rating)/i
          )?.[0]
        ),

      reviews: numberFromText(
        pageText.match(
          /([0-9,]+)\s*(?:ratings?|reviews?)/i
        )?.[0]
      ),

      sellerName,

      sellerId:
        location.href.match(/shopid=(\d+)/)?.[1] ||
        attr("[data-seller-id]", "data-seller-id") ||
        normalizedSellerId(sellerName),

      image: firstImage([
        "[class*='product'] img",
        "img[alt*='product']",
        "img",
      ]),

      platform: "Shopee",
    };
  }

  function extractLazada(pageText) { 
const sellerName = 
firstUsefulText([ 
".seller-name__detail-name", 
"[class*='seller-name']", 
"[class*='store-name']", 
"a[href*='shop']",
 ]) || "Unknown seller";

    return {
      name:
        firstUsefulText([
          "h1",
          ".pdp-mod-product-badge-title",
          "[class*='product-title']",
        ]) || getMetaProductName(),

      price: priceFromText(
        firstUsefulText([
          ".pdp-price",
          "[class*='price']",
          "[class*='Price']",
        ]) || pageText
      ),

      rating:
        decimalFromText(
          firstUsefulText([
            "[class*='score']",
            "[class*='rating']",
          ])
        ) ||
        decimalFromText(
          pageText.match(
            /([0-5](?:\.[0-9])?)\s*(?:stars?|rating)/i
          )?.[0]
        ),

      reviews: numberFromText(
        pageText.match(
          /([0-9,]+)\s*(?:ratings?|reviews?)/i
        )?.[0]
      ),

      sellerName,

      sellerId:
        location.href.match(/sellerId=(\d+)/i)?.[1] ||
        attr("[data-seller-id]", "data-seller-id") ||
        normalizedSellerId(sellerName),

      image: firstImage([
        ".gallery-preview-panel__image",
        "[class*='gallery'] img",
        "[class*='product'] img",
        "img",
      ]),

      platform: "Lazada",
    };
  }

  function extractGeneric(pageText) {
    const sellerName =
      text("[class*='seller']") ||
      text("[class*='shop']") ||
      text("[class*='store']") ||
      "Unknown seller";

    return {
      name:
        firstUsefulText([
          "h1",
          "[class*='title']",
          "[class*='product']",
        ]) ||
        getMetaProductName() ||
        "Unknown product",

      price: priceFromText(pageText),

      rating:
        decimalFromText(
          pageText.match(
            /([0-5](?:\.[0-9])?)\s*(?:stars?|rating)/i
          )?.[0]
        ) || 0,

      reviews: numberFromText(
        pageText.match(
          /([0-9,]+)\s*(?:ratings?|reviews?)/i
        )?.[0]
      ),

      sellerName,

      sellerId: normalizedSellerId(sellerName),

      image: firstImage(["img"]),

      platform: detectPlatform(),
    };
  }

  function scanPage() {
    const pageText = getPageText();

    const platform = detectPlatform();

    const base =
      platform === "Shopee"
        ? extractShopee(pageText)
        : platform === "Lazada"
        ? extractLazada(pageText)
        : extractGeneric(pageText);

    return {
      scannedAt: new Date().toISOString(),

      pageUrl: location.href,

      product: {
        name: base.name || "Unknown product",

        price: base.price || 0,

        image: base.image,

        rating: base.rating || 0,

        reviews: base.reviews || 0,

        status: "verified",

        platform: base.platform || platform,

        sellerId: base.sellerId || "unknown",

        sellerName: base.sellerName || "Unknown seller",

        productUrl: location.href,

        sourceUrl: location.href,
      },

      seller: {
        sellerId: base.sellerId || "unknown",

        name: base.sellerName || "Unknown seller",

        platform: base.platform || platform,

        products:
          numberFromText(
            text(".shopee-seller-overview__item-text-value") ||
            text(".seller-info-value") ||
            text("[class*='product-count']") ||
            text("[class*='products']") ||
            pageText.match(/([0-9,]+)\s+products/i)?.[0]
          ) || 0,

        reports: 0,

        rating:
          base.rating ||
          decimalFromText(
            text("[class*='seller-rating']") ||
            text("[class*='rating']")
          ) || 0,

        status: "verified",

        sourceUrl: location.href,
      },

      warnings: detectDarkPatterns(pageText),
    };
  }

  function renderBanner(scan, sellerCheck) {
    document.getElementById(
      SHOPGUARD_BANNER_ID
    )?.remove();

    const allWarnings = [...scan.warnings];

    if (sellerCheck?.risky) {
      allWarnings.unshift({
        type: "Bogus seller alert",
        severity: "critical",
        message: sellerCheck.message,
      });
    }

    const banner = document.createElement("section");

    banner.id = SHOPGUARD_BANNER_ID;

    banner.className = "shopguard-banner";

    banner.innerHTML = `
      <div class="shopguard-banner__header">
        <h2 class="shopguard-banner__title">
          SHOPGUARD SCAN
        </h2>

        <button
          class="shopguard-banner__close"
          type="button"
          aria-label="Close ShopGuard"
        >
          ×
        </button>
      </div>

      <div class="shopguard-banner__body">
        <p class="shopguard-banner__status">
          ${
            allWarnings.length
              ? `${allWarnings.length} warning${
                  allWarnings.length > 1 ? "s" : ""
                } found.`
              : "No bogus seller warning found."
          }
        </p>

        <ul class="shopguard-banner__list">
          <li class="shopguard-banner__item">
            <strong>Product:</strong>
            ${scan.product.name}
          </li>

          <li class="shopguard-banner__item">
            <strong>Price:</strong>
            ₱${Number(
              scan.product.price || 0
            ).toFixed(2)}
          </li>

          <li class="shopguard-banner__item">
            <strong>Seller:</strong>
            ${scan.seller.name}
          </li>

          <li class="shopguard-banner__item">
            <strong>Seller Rating:</strong>
            ${scan.seller.rating}
          </li>

          <li class="shopguard-banner__item">
            <strong>Products:</strong>
            ${scan.seller.products}
          </li>

          ${allWarnings
            .map(
              (warning) => `
                <li class="shopguard-banner__item ${
                  warning.severity === "critical"
                    ? "shopguard-banner__item--critical"
                    : ""
                }">
                  <strong>${warning.type}:</strong>
                  ${warning.message}
                </li>
              `
            )
            .join("")}
        </ul>
      </div>
    `;

    banner
      .querySelector(".shopguard-banner__close")
      ?.addEventListener("click", () => {
        banner.remove();
      });

    document.documentElement.appendChild(
      banner
    );
  }

  chrome.runtime.onMessage.addListener(
    (message, _sender, sendResponse) => {
      if (
        message.type === "EXTRACT_SHOPGUARD_PAGE"
      ) {
        sendResponse({
          ok: true,
          scan: scanPage(),
        });

        return true;
      }

      if (
        message.type === "SHOW_SHOPGUARD_BANNER"
      ) {
        renderBanner(
          message.payload.scan,
          message.payload.sellerCheck
        );

        sendResponse({
          ok: true,
        });

        return true;
      }

      return false;
    }
  );
})();