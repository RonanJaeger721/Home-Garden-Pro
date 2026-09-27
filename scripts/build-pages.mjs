import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const root = new URL("../", import.meta.url).pathname.replace(/^\/(.:)/, "$1");
const catalog = JSON.parse(await readFile(join(root, "data/catalog.json"), "utf8"));
const products = catalog.items;
const origin = "https://home-garden-pro.vercel.app";
const whatsapp = "https://wa.me/263772302335";

const categories = {
  planters: { name: "Planters", note: "Tall vessels, rounded forms and planting pieces for entrances, courtyards and open garden beds.", image: "/assets/catalog/planters-round.webp" },
  sculptural: { name: "Sculptural", note: "Open forms and statement silhouettes made to hold their own in the landscape.", image: "/assets/catalog/sculptural-leaf.webp" },
  "water-features": { name: "Water features", note: "Concrete basins and water pieces that bring a quieter rhythm to the garden.", image: "/assets/catalog/water-bowl.webp" },
  troughs: { name: "Troughs", note: "Linear forms for boundary planting, layered beds and structured outdoor spaces.", image: "/assets/catalog/troughs-black.webp" }
};

const icons = {
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M14 6l6 6-6 6"/></svg>',
  pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z"/><circle cx="12" cy="10" r="2"/></svg>',
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',
  menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h16M4 16h16"/></svg>'
};

function head(title, description, path = "/", image = "/assets/catalog/hero-yard.webp", type = "website") {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <meta name="theme-color" content="#f3f1ea" />
  <link rel="canonical" href="${origin}${path}" />
  <meta property="og:type" content="${type}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:url" content="${origin}${path}" />
  <meta property="og:image" content="${origin}${image}" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="icon" href="/assets/favicon.ico" sizes="any" />
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/styles.css" />
</head>`;
}

function header(active = "") {
  return `<div class="scroll-progress" aria-hidden="true"><span></span></div>
<header class="site-header" data-site-header>
  <a class="brand" href="/" aria-label="Home and Garden Pro home"><img src="/assets/brand-lockup.jpg" alt="Home & Garden Pro" width="477" height="182" /></a>
  <nav class="desktop-nav" aria-label="Primary navigation">
    <a ${active === "collection" ? 'aria-current="page"' : ""} href="/collection/">Collection</a>
    <a ${active === "gallery" ? 'aria-current="page"' : ""} href="/gallery/">Gallery</a>
    <a ${active === "about" ? 'aria-current="page"' : ""} href="/about/">Our story</a>
    <a ${active === "visit" ? 'aria-current="page"' : ""} href="/visit/">Visit</a>
  </nav>
  <a class="header-cta" href="/collection/">Browse pieces ${icons.arrow}</a>
  <button class="menu-toggle" type="button" aria-label="Open menu" aria-expanded="false" data-menu-toggle>${icons.menu}</button>
</header>
<div class="mobile-menu" data-mobile-menu hidden>
  <div class="mobile-menu-top"><span>Explore</span><button type="button" aria-label="Close menu" data-menu-close>${icons.close}</button></div>
  <nav aria-label="Mobile navigation"><a href="/collection/">Collection</a><a href="/gallery/">Gallery</a><a href="/about/">Our story</a><a href="/visit/">Visit us</a></nav>
  <div><a href="tel:+263772302335">+263 77 230 2335</a><p>18 Crowhill Road, Boxpark<br />Helensvale, Harare</p></div>
</div>`;
}

function footer() {
  return `<footer class="site-footer">
  <div class="footer-lead"><a class="footer-wordmark" href="/">Home &amp;<br />Garden Pro</a><p>Made in Zimbabwe.<br />Made to belong.</p></div>
  <div class="footer-columns">
    <div><h2>Collection</h2><a href="/collection/planters/">Planters</a><a href="/collection/sculptural/">Sculptural</a><a href="/collection/water-features/">Water features</a><a href="/collection/troughs/">Troughs</a></div>
    <div><h2>Explore</h2><a href="/gallery/">Gallery</a><a href="/about/">Our story</a><a href="/visit/">Visit</a><a href="${whatsapp}" target="_blank" rel="noopener">WhatsApp</a></div>
    <div><h2>Visit</h2><p>18 Crowhill Road, Boxpark<br />Helensvale, Harare</p><a href="tel:+263772302335">+263 77 230 2335</a><a href="https://maps.google.com/?q=18%20Crowhill%20Rd%20Boxpark%20Helensvale%20Harare" target="_blank" rel="noopener">Open in Google Maps</a></div>
  </div>
  <div class="footer-base"><span>© 2026 Home &amp; Garden Pro</span><a href="https://wa.me/263789937251">Website built &amp; developed by Jaeger Media</a></div>
</footer>
<div class="quick-view" role="dialog" aria-modal="true" aria-labelledby="quickViewTitle" data-quick-view hidden><div class="quick-view-backdrop" data-quick-close></div><div class="quick-view-panel"><button class="modal-close" type="button" aria-label="Close quick view" data-quick-close>${icons.close}</button><div data-quick-content></div></div></div>
<script src="/app.js" type="module"></script>`;
}

function productCard(product, eager = false) {
  const estimate = product.showEstimate ? `<span class="product-estimate" data-estimate>${estimateLabel(product)}</span>` : "";
  return `<article class="product-card" data-product-card data-category="${product.category}" data-name="${product.name.toLowerCase()}">
    <a class="product-image" href="/products/${product.slug || product.id}/"><img src="${product.image}" alt="${product.alt}" width="900" height="1100" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" /></a>
    <div class="product-meta"><div><p>${product.categoryLabel || categories[product.category]?.name || product.category}</p><h2><a href="/products/${product.slug || product.id}/">${product.name}</a></h2></div>${estimate}<button class="quick-button" type="button" data-quick-slug="${product.slug || product.id}">Quick view</button></div>
  </article>`;
}

function estimateLabel(product) {
  if (!product.showEstimate) return "";
  if (product.estimateMin != null && product.estimateMax != null) return `Est. US$${product.estimateMin}–${product.estimateMax}`;
  if (product.estimateMin != null) return `Est. from US$${product.estimateMin}`;
  if (product.estimateMax != null) return `Est. up to US$${product.estimateMax}`;
  return "";
}

function categoryTiles() {
  return Object.entries(categories).map(([slug, category], index) => `<a class="category-tile category-${index + 1}" href="/collection/${slug}/"><img src="${category.image}" alt="${category.name} at Home & Garden Pro" width="900" height="1100" loading="lazy" decoding="async" /><span><small>0${index + 1}</small><strong>${category.name}</strong>${icons.arrow}</span></a>`).join("");
}

function pageShell(content, { title, description, path, active, image, bodyClass = "" }) {
  return `${head(title, description, path, image)}<body class="${bodyClass}">${header(active)}<main>${content}</main>${footer()}</body></html>`;
}

const home = `${head("Home & Garden Pro | Sculptural garden pieces made in Zimbabwe", "Planters, water features, troughs and sculptural concrete pieces for gardens and outdoor spaces in Harare.", "/")}
<body class="home-page">${header()}
<main>
  <section class="hero" id="top" aria-labelledby="hero-title" data-hero>
    <div class="hero-slides" aria-hidden="true">
      <div class="hero-slide is-active"><img src="/assets/catalog/hero-yard.webp" alt="" width="1600" height="900" fetchpriority="high" /></div>
      <div class="hero-slide"><img src="/assets/catalog/hero-storefront.webp" alt="" width="1600" height="900" /></div>
      <div class="hero-slide"><img src="/assets/catalog/hero-planter-field.webp" alt="" width="1600" height="900" /></div>
      <div class="hero-slide"><img src="/assets/catalog/hero-sculptures.webp" alt="" width="1600" height="900" /></div>
    </div>
    <div class="hero-shade"></div>
    <div class="hero-copy"><p class="eyebrow">Garden form / Harare</p><h1 id="hero-title">Pieces that give<br />the garden <em>form.</em></h1><p>Concrete planters, sculptural pieces, water features and troughs made for Zimbabwean outdoor spaces.</p><a class="light-link" href="/collection/">Explore the collection ${icons.arrow}</a></div>
    <div class="hero-controls"><button type="button" aria-label="Previous image" data-hero-prev>←</button><span><b data-hero-current>01</b> / 04</span><button type="button" aria-label="Next image" data-hero-next>→</button></div>
    <p class="hero-place">Made in Zimbabwe.<br />Made to belong.</p>
  </section>

  <section class="catalogue-run" aria-labelledby="catalogue-run-title">
    <div class="run-head"><p class="eyebrow">Browse by form</p><h2 id="catalogue-run-title">The garden, in motion.</h2><p>Drag to explore</p></div>
    <div class="run-window" data-drag-rail tabindex="0" aria-label="Product categories"><div class="run-track">
      ${Object.entries(categories).map(([slug, category]) => `<a href="/collection/${slug}/"><img src="${category.image}" alt="${category.name}" width="720" height="900" /><span>${category.name}${icons.arrow}</span></a>`).join("")}
      ${Object.entries(categories).map(([slug, category]) => `<a aria-hidden="true" tabindex="-1" href="/collection/${slug}/"><img src="${category.image}" alt="" width="720" height="900" /><span>${category.name}${icons.arrow}</span></a>`).join("")}
    </div></div>
  </section>

  <section class="intro-band section-shell" data-reveal><p class="section-number">01</p><div><p class="eyebrow">A different kind of presence</p><h2>Not decoration.<br /><em>Structure for the landscape.</em></h2></div><p>Some pieces hold planting. Some hold water. Others simply hold the eye. Together, they give outdoor spaces rhythm, weight and a clear point of view.</p></section>

  <section class="category-section section-shell" aria-labelledby="browse-title"><div class="section-heading" data-reveal><p class="eyebrow">The collection</p><h2 id="browse-title">Browse by character.</h2><a href="/collection/">View all pieces ${icons.arrow}</a></div><div class="category-layout">${categoryTiles()}</div></section>

  <section class="selected-section section-shell" aria-labelledby="selected-title"><div class="selected-copy" data-reveal><p class="eyebrow">Selected pieces</p><h2 id="selected-title">Forms worth<br />walking around.</h2><p>Each angle carries a different line. Open a piece to see more views, then ask us about current finishes and availability.</p></div><div class="selected-grid" data-catalog-grid data-limit="4" data-featured="true">${products.filter((p) => p.featured).slice(0, 4).map((p) => productCard(p)).join("")}</div></section>

  <section class="image-statement"><img src="/assets/catalog/sculptural-monument.webp" alt="Monumental open-form garden sculpture displayed outdoors" width="900" height="1100" loading="lazy" decoding="async" /><div data-reveal><p class="eyebrow">Statement scale</p><h2>Let one piece<br />change the whole view.</h2><a class="light-link" href="/collection/sculptural/">Explore sculptural pieces ${icons.arrow}</a></div></section>

  <section class="space-section section-shell" aria-labelledby="space-title"><div class="section-heading" data-reveal><p class="eyebrow">Shop by space</p><h2 id="space-title">Begin with where it will live.</h2></div><div class="space-list"><a href="/collection/?space=entrance"><span>01</span><strong>Entrances</strong><p>Tall forms that frame arrival.</p>${icons.arrow}</a><a href="/collection/?space=courtyard"><span>02</span><strong>Courtyards</strong><p>Low pieces for quiet gathering spaces.</p>${icons.arrow}</a><a href="/collection/?space=garden"><span>03</span><strong>Open gardens</strong><p>Sculptural scale with room to breathe.</p>${icons.arrow}</a><a href="/collection/?space=boundary"><span>04</span><strong>Boundaries</strong><p>Linear forms for rhythm and structure.</p>${icons.arrow}</a></div></section>

  <section class="gallery-peek" aria-labelledby="gallery-peek-title"><div class="section-shell"><div class="section-heading inverse" data-reveal><p class="eyebrow">The yard right now</p><h2 id="gallery-peek-title">A living catalogue.</h2><a href="/gallery/">Open the gallery ${icons.arrow}</a></div></div><div class="gallery-strip"><img src="/assets/catalog/visit-path.webp" alt="Long outdoor display of Home & Garden Pro pieces" width="1080" height="626" loading="lazy" /><img src="/assets/catalog/yard-bowls.webp" alt="Concrete bowls and rounded planters in the yard" width="1040" height="832" loading="lazy" /><img src="/assets/catalog/finish-earth.webp" alt="Warm earth-finish garden vessels" width="1080" height="864" loading="lazy" /></div></section>

  <section class="finish-section section-shell" aria-labelledby="finish-title"><div class="finish-image"><img src="/assets/catalog/finish-granite.webp" alt="Close view of speckled granite-finish concrete planter" width="864" height="1080" loading="lazy" /></div><div class="finish-copy" data-reveal><p class="eyebrow">Finish & texture</p><h2 id="finish-title">Light changes<br />the surface.</h2><p>Speckled granite, pale concrete, charcoal and warm earth tones each settle differently into a garden. Visit the yard to see the finish in natural light.</p><a class="text-link" href="/visit/">Plan your visit ${icons.arrow}</a></div></section>

  <section class="why-band"><div class="section-shell"><p class="eyebrow">Why Home &amp; Garden Pro</p><div class="why-grid"><h2>Made here.<br />Chosen in person.<br />Built for outside.</h2><div><p><b>01</b>Real pieces, photographed at our Harare display.</p><p><b>02</b>A broad family of forms, finishes and scales.</p><p><b>03</b>Direct help choosing a piece for your space.</p></div></div></div></section>

  <section class="visit-teaser section-shell"><div><p class="eyebrow">Boxpark, Helensvale</p><h2>Come get a sense<br />of the real scale.</h2><p>18 Crowhill Road, Boxpark, Helensvale, Harare.<br />Open 24 hours.</p><div class="button-row"><a class="button dark" href="/visit/">Visit details ${icons.arrow}</a><a class="button line" href="https://maps.google.com/?q=18%20Crowhill%20Rd%20Boxpark%20Helensvale%20Harare" target="_blank" rel="noopener">${icons.pin} Google Maps</a></div></div><img src="/assets/catalog/visit-display.webp" alt="Home & Garden Pro outdoor display in Harare" width="1080" height="864" loading="lazy" /></section>

  <section class="closing-cta"><img src="/assets/catalog/hero-storefront.webp" alt="Home & Garden Pro showroom and garden display" width="1600" height="900" loading="lazy" /><div><p class="eyebrow">Need help choosing?</p><h2>Send us the space.<br />We’ll help find the form.</h2><a class="light-link" href="${whatsapp}?text=Hello%20Home%20%26%20Garden%20Pro%2C%20I%27d%20like%20help%20choosing%20a%20piece%20for%20my%20space." target="_blank" rel="noopener">Talk to us on WhatsApp ${icons.arrow}</a></div></section>
</main>${footer()}</body></html>`;

function collectionPage(categoryKey = "") {
  const category = categories[categoryKey];
  const title = category ? `${category.name} | Home & Garden Pro` : "Garden collection | Home & Garden Pro";
  const description = category ? category.note : "Browse planters, sculptural pieces, water features and troughs from Home & Garden Pro in Harare.";
  const path = category ? `/collection/${categoryKey}/` : "/collection/";
  const shown = category ? products.filter((p) => p.category === categoryKey) : products;
  const label = category ? category.name : "The full collection";
  return pageShell(`<section class="page-hero collection-hero"><div><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span>${category ? '<a href="/collection/">Collection</a><span>/</span>' : ""}<span>${label}</span></nav><p class="eyebrow">Catalogue / Current edit</p><h1>${category ? category.name : "Objects for<br /><em>outdoor living.</em>"}</h1><p>${description}</p></div>${category ? `<img src="${category.image}" alt="${category.name} at Home & Garden Pro" width="900" height="1100" />` : `<img src="/assets/catalog/hero-planter-field.webp" alt="Home & Garden Pro collection displayed outdoors" width="1600" height="900" />`}</section>
  <section class="catalogue-section section-shell" data-catalogue data-category="${categoryKey}"><div class="catalogue-tools"><label class="search-box">${icons.search}<span class="sr-only">Search the collection</span><input type="search" placeholder="Search pieces" data-catalog-search /></label><div class="filter-row" role="group" aria-label="Filter collection"><button type="button" data-filter="all" aria-pressed="${categoryKey ? "false" : "true"}">All</button>${Object.entries(categories).map(([key, value]) => `<button type="button" data-filter="${key}" aria-pressed="${key === categoryKey ? "true" : "false"}">${value.name}</button>`).join("")}</div><p><span data-result-count>${shown.length}</span> pieces</p></div><div class="catalogue-grid" data-catalog-grid data-category="${categoryKey}">${shown.map((p) => productCard(p)).join("")}</div><div class="empty-state" data-empty-state hidden><h2>No pieces match that search.</h2><p>Try another term or clear the active filter.</p></div></section>
  <section class="collection-note section-shell"><p class="eyebrow">Availability changes</p><h2>See something you like?</h2><p>Ask us about current finishes and availability, or visit the yard to compare forms at full scale.</p><a class="button dark" href="${whatsapp}?text=Hello%20Home%20%26%20Garden%20Pro%2C%20I%27d%20like%20to%20ask%20about%20your%20current%20collection." target="_blank" rel="noopener">Ask on WhatsApp ${icons.arrow}</a></section>`, { title, description, path, active: "collection", image: category?.image || "/assets/catalog/hero-planter-field.webp", bodyClass: "collection-page" });
}

const galleryItems = [
  ["Planters", "/assets/catalog/planters-round.webp", "Rounded planters arranged outdoors"], ["Planters", "/assets/catalog/planters-tall.webp", "Tall pale concrete planters"], ["Planters", "/assets/catalog/planters-organic.webp", "Organic rounded concrete planters"],
  ["Sculptural", "/assets/catalog/sculptural-leaf.webp", "Open leaf-form garden sculptures"], ["Sculptural", "/assets/catalog/sculptural-loop.webp", "Looped sculptural concrete pieces"], ["Sculptural", "/assets/catalog/sculptural-monument.webp", "Monumental open-form garden sculpture"],
  ["Water", "/assets/catalog/water-bowl.webp", "Working circular concrete water feature"], ["Water", "/assets/catalog/water-pedestal.webp", "Pedestal basin water piece"], ["Water", "/assets/client-water-feature.webp", "Low circular water feature"],
  ["At Boxpark", "/assets/catalog/visit-path.webp", "Long display of garden vessels at Boxpark"], ["At Boxpark", "/assets/catalog/visit-display.webp", "Home & Garden Pro outdoor showroom"], ["At Boxpark", "/assets/catalog/hero-yard.webp", "Wide view of the Home & Garden Pro collection"]
];

const gallery = pageShell(`<section class="page-hero gallery-hero"><div><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><span>Gallery</span></nav><p class="eyebrow">The yard / In full view</p><h1>Form, texture<br />and <em>scale.</em></h1><p>A closer look at the pieces, finishes and outdoor display at Boxpark.</p></div><img src="/assets/catalog/hero-yard.webp" alt="Wide view of Home & Garden Pro pieces displayed outside" width="1600" height="900" /></section>
<section class="gallery-index section-shell"><p>Browse the gallery</p><div>${["Planters", "Sculptural", "Water", "At Boxpark"].map((g) => `<a href="#${g.toLowerCase().replaceAll(" ", "-")}">${g}</a>`).join("")}</div></section>
${["Planters", "Sculptural", "Water", "At Boxpark"].map((group) => `<section class="gallery-group section-shell" id="${group.toLowerCase().replaceAll(" ", "-")}" aria-labelledby="${group.toLowerCase().replaceAll(" ", "-")}-title"><div class="gallery-group-head"><p class="eyebrow">${String(["Planters", "Sculptural", "Water", "At Boxpark"].indexOf(group) + 1).padStart(2, "0")}</p><h2 id="${group.toLowerCase().replaceAll(" ", "-")}-title">${group}</h2></div><div class="gallery-mosaic">${galleryItems.filter((i) => i[0] === group).map((item, index) => `<button class="gallery-item gallery-shape-${index + 1}" type="button" data-lightbox-src="${item[1]}" data-lightbox-alt="${item[2]}"><img src="${item[1]}" alt="${item[2]}" width="900" height="1100" loading="lazy" /><span>Open image</span></button>`).join("")}</div></section>`).join("")}
<div class="lightbox" role="dialog" aria-modal="true" aria-label="Gallery image viewer" data-lightbox hidden><div class="lightbox-top"><span data-lightbox-count></span><button type="button" aria-label="Close gallery" data-lightbox-close>${icons.close}</button></div><button type="button" aria-label="Previous image" data-lightbox-prev>←</button><figure><img data-lightbox-image alt="" /><figcaption data-lightbox-caption></figcaption></figure><button type="button" aria-label="Next image" data-lightbox-next>→</button></div>`, { title: "Gallery | Home & Garden Pro", description: "See Home & Garden Pro planters, sculptural garden pieces, water features and the outdoor display at Boxpark in Harare.", path: "/gallery/", active: "gallery", bodyClass: "gallery-page" });

const about = pageShell(`<section class="story-hero"><img src="/assets/catalog/visit-path.webp" alt="Home & Garden Pro pieces lining the outdoor display" width="1600" height="900" /><div><nav class="breadcrumbs light" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><span>Our story</span></nav><p class="eyebrow">Home &amp; Garden Pro</p><h1>Made in Zimbabwe.<br /><em>Made to belong.</em></h1></div></section>
<section class="story-intro section-shell"><p class="section-number">01</p><div><p class="eyebrow">Our point of view</p><h2>Outdoor pieces should feel part of the place.</h2></div><p>Home &amp; Garden Pro brings together concrete planters, water features, troughs and sculptural forms for gardens and outdoor spaces. The collection is displayed in Harare, where scale, texture and finish can be experienced in person.</p></section>
<section class="story-chapter section-shell"><div class="story-copy"><p class="eyebrow">Form before fuss</p><h2>Strong silhouettes.<br />Quiet finishes.</h2><p>The pieces work through proportion and presence: a tall vessel at an entrance, a low basin in a courtyard, a sculptural form where the landscape needs a focal point.</p></div><div class="story-stack"><img src="/assets/catalog/sculptural-lineup.webp" alt="Sculptural garden pieces in warm earth and grey finishes" width="1080" height="864" loading="lazy" /><img src="/assets/catalog/finish-granite.webp" alt="Speckled granite finish on a concrete planter" width="864" height="1080" loading="lazy" /></div></section>
<section class="story-values"><div class="section-shell"><p class="eyebrow">How to choose</p><div class="value-lines"><p><span>01</span><b>Start with the space.</b> Consider the view, planting and the distance from which the piece will be seen.</p><p><span>02</span><b>Read the silhouette.</b> Choose height, width and openness before settling on the surface finish.</p><p><span>03</span><b>See it in daylight.</b> Natural light reveals texture and makes comparison easier.</p></div></div></section>
<section class="story-outro section-shell"><img src="/assets/catalog/hero-storefront.webp" alt="Home & Garden Pro storefront at Boxpark" width="1600" height="900" loading="lazy" /><div><p class="eyebrow">See the collection</p><h2>The best next step<br />is a walk through the yard.</h2><a class="button dark" href="/visit/">Plan your visit ${icons.arrow}</a></div></section>`, { title: "Our story | Home & Garden Pro", description: "Home & Garden Pro presents concrete planters, water features, troughs and sculptural garden forms in Harare, Zimbabwe.", path: "/about/", active: "about", image: "/assets/catalog/visit-path.webp", bodyClass: "about-page" });

const visit = pageShell(`<section class="visit-hero"><div><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><span>Visit</span></nav><p class="eyebrow">Find the yard</p><h1>Come see the<br /><em>real scale.</em></h1><p>Compare silhouettes, finishes and proportions in person at our outdoor display in Helensvale.</p><div class="button-row"><a class="button dark" href="https://maps.google.com/?q=18%20Crowhill%20Rd%20Boxpark%20Helensvale%20Harare" target="_blank" rel="noopener">${icons.pin} Open Google Maps</a><a class="button line" href="tel:+263772302335">Call us</a></div></div><img src="/assets/catalog/hero-storefront.webp" alt="Home & Garden Pro storefront at Boxpark, Helensvale" width="1600" height="900" /></section>
<section class="visit-details section-shell"><div><p class="eyebrow">Address</p><h2>18 Crowhill Road<br />Boxpark, Helensvale<br />Harare</h2></div><div><p class="eyebrow">Hours & contact</p><p>Open 24 hours</p><a href="tel:+263772302335">+263 77 230 2335</a><a href="${whatsapp}?text=Hello%20Home%20%26%20Garden%20Pro%2C%20I%27m%20planning%20a%20visit%20to%20Boxpark." target="_blank" rel="noopener">Message on WhatsApp</a></div></section>
<section class="map-section"><a href="https://maps.google.com/?q=18%20Crowhill%20Rd%20Boxpark%20Helensvale%20Harare" target="_blank" rel="noopener" aria-label="Open Home and Garden Pro in Google Maps"><div class="map-grid" aria-hidden="true"></div><span class="map-pin">${icons.pin}</span><div><p>Google Maps</p><h2>Lost? Tap the pin.</h2><span>Get turn-by-turn directions ${icons.arrow}</span></div></a></section>
<section class="visit-guide section-shell"><div><p class="eyebrow">Before you come</p><h2>Bring a photo<br />of the space.</h2><p>A wide view and a rough sense of the available footprint will make it easier to compare shapes and scale when you arrive.</p></div><div class="visit-guide-images"><img src="/assets/catalog/yard-planters.webp" alt="Outdoor display of planters" width="1080" height="864" loading="lazy" /><img src="/assets/catalog/yard-bowls.webp" alt="Outdoor display of bowls and vessels" width="1040" height="832" loading="lazy" /></div></section>`, { title: "Visit Home & Garden Pro | Boxpark, Helensvale", description: "Visit Home & Garden Pro at 18 Crowhill Road, Boxpark, Helensvale, Harare. Open 24 hours. Get directions with Google Maps.", path: "/visit/", active: "visit", image: "/assets/catalog/hero-storefront.webp", bodyClass: "visit-page" });

function productPage(product) {
  const related = products.filter((p) => p.id !== product.id && p.category === product.category).slice(0, 3);
  const allRelated = related.length ? related : products.filter((p) => p.id !== product.id).slice(0, 3);
  const path = `/products/${product.slug || product.id}/`;
  const enquiry = `${whatsapp}?text=${encodeURIComponent(`Hello Home & Garden Pro, I'm interested in the ${product.name}. Could you tell me about current finishes and availability?`)}`;
  const structured = JSON.stringify({ "@context": "https://schema.org", "@type": "Product", name: product.name, image: product.images, description: product.summary, brand: { "@type": "Brand", name: "Home & Garden Pro" }, url: `${origin}${path}` }).replaceAll("<", "\\u003c");
  return `${head(`${product.name} | Home & Garden Pro`, `${product.summary} Ask Home & Garden Pro about current finishes and availability.`, path, product.image, "product")}<body class="product-page">${header("collection")}<main>
  <section class="product-detail" data-product-page data-slug="${product.slug || product.id}"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/collection/">Collection</a><span>/</span><span>${product.name}</span></nav><div class="product-gallery">${product.images.map((image, index) => `<img src="${image}" alt="${index === 0 ? product.alt : `${product.name}, view ${index + 1}`}" width="900" height="1100" ${index ? 'loading="lazy"' : 'fetchpriority="high"'} />`).join("")}</div><aside class="product-info"><p class="eyebrow">${product.categoryLabel}</p><h1>${product.name}</h1><p class="product-family">${product.family}</p><p>${product.summary}</p>${product.showEstimate ? `<p class="detail-estimate">${estimateLabel(product)}</p>` : ""}<div class="product-actions"><a class="button dark" href="${enquiry}" target="_blank" rel="noopener">Ask about this piece ${icons.arrow}</a><a class="button line" href="/visit/">See it at Boxpark</a></div><dl><div><dt>Category</dt><dd><a href="/collection/${product.category}/">${categories[product.category]?.name || product.categoryLabel}</a></dd></div><div><dt>Availability</dt><dd>Ask for current availability</dd></div></dl></aside></section>
  <section class="related-section section-shell"><div class="section-heading"><p class="eyebrow">Continue browsing</p><h2>Related forms.</h2><a href="/collection/${product.category}/">View category ${icons.arrow}</a></div><div class="catalogue-grid compact">${allRelated.map((p) => productCard(p)).join("")}</div></section></main>${footer()}<script type="application/ld+json">${structured}</script></body></html>`;
}

const genericProduct = `${head("Product | Home & Garden Pro", "Explore a Home & Garden Pro garden piece and ask about current finishes and availability.", "/products/")}<body class="product-page">${header("collection")}<main><section class="dynamic-product" data-dynamic-product><p class="eyebrow">Loading piece</p><h1>Home &amp; Garden Pro</h1></section></main>${footer()}</body></html>`;

const files = new Map([
  ["index.html", home],
  ["collection/index.html", collectionPage()],
  ...Object.keys(categories).map((key) => [`collection/${key}/index.html`, collectionPage(key)]),
  ["gallery/index.html", gallery],
  ["about/index.html", about],
  ["visit/index.html", visit],
  ["product.html", genericProduct],
  ...products.map((product) => [`products/${product.slug || product.id}/index.html`, productPage(product)])
]);

for (const [relative, content] of files) {
  const destination = join(root, relative);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, content, "utf8");
}

console.log(`Built ${files.size} pages.`);

const dist = join(root, "dist");
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

const publish = [
  "index.html", "404.html", "product.html", "styles.css", "app.js",
  "robots.txt", "sitemap.xml", "assets", "admin", "data", "collection",
  "gallery", "about", "visit", "products"
];

for (const entry of publish) {
  await cp(join(root, entry), join(dist, entry), { recursive: true });
}

console.log("Prepared dist for deployment.");
