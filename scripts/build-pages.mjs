import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const root = new URL("../", import.meta.url).pathname.replace(/^\/(.:)/, "$1");
const catalog = JSON.parse(await readFile(join(root, "data/catalog.json"), "utf8"));
const products = catalog.items.filter((item) => item.visible !== false && item.archived !== true);
const origin = "https://home-garden-pro.vercel.app";
const whatsapp = "https://wa.me/263772302335";
const catalogueUrl = catalog.settings?.whatsappCatalogUrl || "https://wa.me/c/30404207759615";
const mapsUrl = "https://www.google.com/maps/search/?api=1&query=Box+Park%2C+18+Crowhill+Road%2C+Harare%2C+Zimbabwe";

const categories = {
  planters: {
    name: "Tall & rounded forms",
    short: "Planters",
    note: "Vessels that bring height, rhythm and planting into balance.",
    image: "/assets/catalog/planters-vessels.webp",
    fit: "contain",
  },
  sculptural: {
    name: "Sculptural",
    short: "Sculptural",
    note: "Open silhouettes made to hold their own in the landscape.",
    image: "/assets/catalog/sculptural-leaf.webp",
    fit: "contain",
  },
  "water-features": {
    name: "Water features",
    short: "Water",
    note: "Quiet basins and water pieces for slower garden moments.",
    image: "/assets/catalog/water-bowl.webp",
    fit: "contain",
  },
  troughs: {
    name: "Troughs",
    short: "Troughs",
    note: "Linear forms for edges, boundaries and layered planting.",
    image: "/assets/catalog/troughs-stacked.webp",
    fit: "contain",
  },
};

const icons = {
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M14 6l6 6-6 6"/></svg>',
  northEast: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>',
  pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z"/><circle cx="12" cy="10" r="2"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',
  menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h16M4 16h16"/></svg>',
};

function head(title, description, path = "/", image = "/assets/catalog/hero-yard.webp", type = "website") {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <meta name="theme-color" content="#173f32" />
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
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
${path === "/" ? '<link rel="preload" href="/assets/catalog/hero-storefront.webp" as="image" type="image/webp" />' : ""}
  <link rel="stylesheet" href="/styles.css" />
</head>`;
}

function header(active = "") {
  return `<div class="scroll-progress" aria-hidden="true"><span></span></div>
<div class="section-marker" aria-hidden="true" data-section-marker>01 / INTRO</div>
<header class="site-header" data-site-header>
  <div class="nav-shell">
    <a class="brand" href="/" aria-label="Home and Garden Pro home" data-admin-shortcut><img src="/assets/brand-lockup-transparent.png" alt="Home & Garden Pro" width="2030" height="775" /></a>
    <nav class="desktop-nav" aria-label="Primary navigation" data-desktop-nav>
      <span class="nav-active-pill" aria-hidden="true" data-nav-pill></span>
      <a data-nav-key="home" ${active === "home" || !active ? 'aria-current="page"' : ""} href="/">Home</a>
      <a data-nav-key="collection" ${active === "collection" ? 'aria-current="page"' : ""} href="/collection/">Collection</a>
      <a data-nav-key="pieces" ${active === "pieces" ? 'aria-current="page"' : ""} href="/#pieces">Pieces</a>
      <a data-nav-key="spaces" ${active === "spaces" ? 'aria-current="page"' : ""} href="/#spaces">Spaces</a>
      <a data-nav-key="about" ${active === "about" ? 'aria-current="page"' : ""} href="/about/">About</a>
      <a data-nav-key="visit" ${active === "visit" ? 'aria-current="page"' : ""} href="/visit/">Visit</a>
    </nav>
    <button class="menu-toggle" type="button" aria-label="Open menu" aria-expanded="false" data-menu-toggle><span>Menu</span>${icons.menu}</button>
  </div>
</header>
<div class="mobile-menu" data-mobile-menu hidden>
  <div class="mobile-menu-top"><span>Home &amp; Garden Pro</span><button type="button" aria-label="Close menu" data-menu-close>${icons.close}</button></div>
  <nav aria-label="Mobile navigation"><a data-nav-key="home" href="/">Home</a><a data-nav-key="collection" href="/collection/">Collection</a><a data-nav-key="pieces" href="/#pieces">Pieces</a><a data-nav-key="spaces" href="/#spaces">Spaces</a><a data-nav-key="about" href="/about/">About</a><a data-nav-key="visit" href="/visit/">Visit</a></nav>
  <div><a href="tel:+263772302335">+263 77 230 2335</a><p>18 Crowhill Road, Boxpark<br />Helensvale, Harare</p></div>
</div>`;
}

function footer() {
  return `<footer class="site-footer" data-section-name="05 / VISIT">
  <div class="footer-lead"><a class="footer-wordmark" href="/">Home &amp; Garden Pro</a><p>Made in Zimbabwe.<br />Made to belong.</p></div>
  <div class="footer-columns">
    <div><h2>Explore</h2><a href="/collection/">Collection</a><a href="/gallery/">A closer look</a><a href="/about/">Our story</a><a href="/visit/">Visit</a></div>
    <div><h2>Find us</h2><p>18 Crowhill Road<br />Boxpark, Helensvale<br />Harare</p></div>
    <div><h2>Contact</h2><a href="tel:+263772302335">+263 77 230 2335</a><a href="${catalogueUrl}" data-catalogue-link target="_blank" rel="noopener noreferrer">WhatsApp catalogue</a><a href="${mapsUrl}" target="_blank" rel="noopener noreferrer">Google Maps</a></div>
  </div>
  <div class="footer-base"><span>© 2026 Home &amp; Garden Pro <a class="admin-link" href="/admin/">Admin</a></span><a href="https://wa.me/263789937251">Website built &amp; developed by Jaeger Media</a></div>
</footer>
<div class="enquiry-modal" role="dialog" aria-modal="true" aria-labelledby="enquiryTitle" data-enquiry-modal hidden>
  <button class="enquiry-backdrop" type="button" aria-label="Close enquiry" data-enquiry-close></button>
  <div class="enquiry-panel"><button class="modal-close" type="button" aria-label="Close enquiry" data-enquiry-close>${icons.close}</button><div data-enquiry-content></div></div>
</div>
<script src="/app.js" type="module"></script>`;
}

const validPrice = (value) => Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : null;
const money = (value) => `$${Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

function productRange(product) {
  const sizePrices = (product.sizes || []).map((size) => validPrice(size.price)).filter(Boolean);
  const prices = sizePrices.length ? sizePrices : [validPrice(product.priceFrom), validPrice(product.priceTo)].filter(Boolean);
  if (!prices.length) return null;
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

function priceLabel(product) {
  const range = productRange(product);
  if (!product.showPrice || !range) return "Ask for current price";
  return range.min === range.max ? `From ${money(range.min)}` : `${money(range.min)} - ${money(range.max)}`;
}

function sizeOptions(product) {
  if (!product.showPrice) return "";
  const sizes = (product.sizes || []).filter((size) => size.label && validPrice(size.price));
  if (!sizes.length) return "";
  return `<div class="size-options" role="group" aria-label="Available sizes">${sizes.map((size, index) => `<button class="size-option${index === 0 ? " is-selected" : ""}" type="button" data-size-option data-size-label="${size.label}" data-size-price="${validPrice(size.price)}"><span>${size.label}</span>${size.dimensions ? `<small>${size.dimensions}</small>` : ""}<strong>${money(size.price)}</strong></button>`).join("")}</div>`;
}

function pieceCard(product, index = 0) {
  const slug = product.slug || product.id;
  return `<article class="piece-card" data-product-card data-category="${product.category}" data-name="${product.name.toLowerCase()}" data-reveal="${index % 2 ? "right" : "left"}" style="--delay:${(index % 4) * 70}ms">
    <a class="piece-image fit-contain" href="/products/${slug}/"><img src="${product.image}" alt="${product.alt}" width="864" height="1080" loading="lazy" decoding="async" /></a>
    <div class="piece-meta"><p>${product.categoryLabel || categories[product.category]?.short || product.category}</p><h3><a href="/products/${slug}/">${product.name}</a></h3><span class="piece-price">${priceLabel(product)}</span><a class="motion-link" href="/products/${slug}/">View piece ${icons.northEast}</a></div>
  </article>`;
}

function categoryTiles() {
  return Object.entries(categories).map(([slug, category], index) => `<a class="form-tile form-${index + 1}" href="/collection/${slug}/" data-reveal="${index % 2 ? "right" : "clip"}" style="--delay:${index * 70}ms">
    <span class="form-image ${category.fit === "contain" ? "fit-contain" : ""}"><img src="${category.image}" alt="${category.name} at Home & Garden Pro" width="864" height="1080" loading="lazy" decoding="async" /></span>
    <span class="form-caption"><small>0${index + 1}</small><strong>${category.name}</strong><i></i>${icons.northEast}</span>
  </a>`).join("");
}

function pageShell(content, { title, description, path, active, image, bodyClass = "" }) {
  return `${head(title, description, path, image)}<body class="${bodyClass}">${header(active)}<main>${content}</main>${footer()}</body></html>`;
}

const homeGallery = [
  ["/assets/catalog/sculptural-loop.webp", "Looped sculptural concrete form"],
  ["/assets/catalog/planters-round.webp", "Rounded planters arranged in the yard"],
  ["/assets/catalog/visit-path.webp", "Home & Garden Pro display along the garden path"],
  ["/assets/catalog/water-pedestal.webp", "Pedestal water feature"],
  ["/assets/catalog/planters-tall.webp", "Tall pale concrete planters"],
  ["/assets/catalog/sculptural-lineup.webp", "Sculptural pieces in natural finishes"],
];

const spaceOptions = [
  ["entrance", "Entrance", "/assets/catalog/planters-tall.webp", "Tall forms that give arrival a clear vertical rhythm."],
  ["courtyard", "Courtyard", "/assets/catalog/water-bowl.webp", "Low, quiet pieces for enclosed spaces and slow moments."],
  ["garden", "Garden", "/assets/catalog/sculptural-leaf.webp", "Sculptural silhouettes with enough room to be read from every side."],
  ["patio", "Patio", "/assets/catalog/yard-bowls.webp", "Rounded vessels that sit comfortably alongside gathering spaces."],
  ["interior", "Interior", "/assets/catalog/finish-granite.webp", "Restrained forms and finishes for planted indoor thresholds."],
];

const home = `${head("Home & Garden Pro | Sculptural garden pieces made in Zimbabwe", "Planters, water features, troughs and sculptural concrete pieces for gardens and outdoor spaces in Harare.", "/")}
<body class="home-page">${header()}
<main>
  <section class="hero" id="top" aria-labelledby="hero-title" data-hero data-nav-section="home" data-section-name="01 / INTRO">
    <div class="hero-slides" aria-hidden="true">
      <div class="hero-slide is-active"><img src="/assets/catalog/hero-storefront.webp" alt="" width="1074" height="859" fetchpriority="high" /></div>
      <div class="hero-slide"><img src="/assets/catalog/hero-yard.webp" alt="" width="1080" height="400" decoding="async" /></div>
      <div class="hero-slide"><img src="/assets/catalog/hero-sculptures.webp" alt="" width="1080" height="864" loading="lazy" decoding="async" /></div>
      <div class="hero-slide"><img src="/assets/catalog/hero-planter-field.webp" alt="" width="1080" height="863" loading="lazy" decoding="async" /></div>
    </div>
    <div class="hero-shade" aria-hidden="true"></div>
    <div class="hero-copy">
      <p class="eyebrow">Garden form / Harare</p>
      <h1 id="hero-title">Pieces that give<br />the garden form.</h1>
      <p>Concrete planters, sculptural pieces, water features and troughs made for Zimbabwean spaces.</p>
      <a class="light-link" href="/collection/">Explore the collection ${icons.northEast}</a>
    </div>
    <p class="hero-place">Made in Zimbabwe.<br />Made to belong.</p>
    <div class="hero-cycle" aria-hidden="true"><span></span></div>
    <a class="scroll-cue" href="#intro"><span>Scroll to discover</span><i></i></a>
  </section>

  <section class="brand-intro section-shell" id="intro" data-section-name="01 / INTRO">
    <p class="section-number" data-reveal>01 / POINT OF VIEW</p>
    <div data-reveal style="--delay:70ms"><p class="eyebrow">Made to belong</p><h2>Your garden does not need more noise.<br /><em>It needs one beautiful anchor.</em></h2></div>
    <p data-reveal style="--delay:140ms">Home &amp; Garden Pro creates substantial forms for entrances, courtyards, gardens and interiors. Each piece is selected for silhouette, texture and the way it settles into a space.</p>
  </section>

  <section class="forms-section section-shell" aria-labelledby="forms-title" data-nav-section="collection" data-section-name="02 / FORMS">
    <div class="section-heading" data-reveal><div><p class="section-number">02 / THE COLLECTION</p><span class="animated-rule"></span><h2 id="forms-title">Our forms.</h2></div><p>Four families. One considered garden language.</p></div>
    <div class="forms-layout">${categoryTiles()}</div>
  </section>

  <section class="catalogue-run" aria-labelledby="catalogue-run-title" data-section-name="02 / FORMS">
    <div class="run-head section-shell" data-reveal><div><p class="eyebrow">A moving detail</p><h2 id="catalogue-run-title">The garden, in motion.</h2></div><p>Drag or swipe</p></div>
    <div class="run-window" data-drag-rail tabindex="0" role="group" aria-label="Product categories"><div class="run-track">
      ${Object.entries(categories).map(([slug, category]) => `<a href="/collection/${slug}/"><span class="run-image"><img src="${category.image}" alt="" width="480" height="600" loading="lazy" /></span><strong>${category.short}</strong></a>`).join("")}
      ${Object.entries(categories).map(([slug, category]) => `<a aria-hidden="true" tabindex="-1" href="/collection/${slug}/"><span class="run-image"><img src="${category.image}" alt="" width="480" height="600" loading="lazy" /></span><strong>${category.short}</strong></a>`).join("")}
    </div></div>
  </section>

  <section class="media-moment section-shell" aria-labelledby="media-title" data-media-rotator data-section-name="03 / MATERIAL">
    <div class="media-copy" data-reveal="left"><p class="section-number">03 / MATERIAL</p><span class="animated-rule"></span><h2 id="media-title">Concrete changes<br />with the light.</h2><p>Granite speckle, pale mineral surfaces and warm earth finishes settle differently throughout the day. The form stays strong; the surface keeps moving.</p><a class="motion-link" href="/gallery/">A closer look ${icons.northEast}</a></div>
    <div class="media-frame" data-reveal="clip" style="--delay:150ms">
      <img class="is-active" src="/assets/catalog/finish-granite.webp" alt="Granite-finish concrete planter" width="864" height="1080" loading="lazy" />
      <img src="/assets/catalog/finish-earth.webp" alt="Warm earth-finish garden vessel" width="864" height="1080" loading="lazy" />
      <img src="/assets/catalog/planters-vessels.webp" alt="Tall vessels in natural finishes" width="863" height="1080" loading="lazy" />
      <span>Finish / form / daylight</span>
    </div>
  </section>

  <section class="space-selector" id="spaces" data-space-selector data-nav-section="spaces" data-section-name="04 / SPACES">
    <div class="space-visual" data-reveal="clip">
      ${spaceOptions.map((option, index) => `<img class="${index === 0 ? "is-active" : ""}" src="${option[2]}" alt="${option[1]} inspiration" width="864" height="1080" loading="lazy" data-space-image="${option[0]}" />`).join("")}
      <span class="glass-label">Where will it live?</span>
    </div>
    <div class="space-copy">
      <p class="section-number" data-reveal>04 / SPACE</p>
      <h2 data-reveal style="--delay:70ms">Begin with<br />the setting.</h2>
      <div class="space-options" role="tablist" aria-label="Choose a space">
        ${spaceOptions.map((option, index) => `<button type="button" role="tab" aria-selected="${index === 0}" data-space-option="${option[0]}" data-space-note="${option[3]}">${option[1]}<span>${icons.arrow}</span></button>`).join("")}
      </div>
      <p class="space-note" data-space-note>${spaceOptions[0][3]}</p>
    </div>
  </section>

  <section class="pieces-section section-shell" id="pieces" aria-labelledby="pieces-title" data-nav-section="pieces" data-section-name="03 / PIECES">
    <div class="section-heading" data-reveal><div><p class="section-number">03 / SELECTED PIECES</p><span class="animated-rule"></span><h2 id="pieces-title">A considered edit.</h2></div><a class="motion-link" href="/collection/">View the collection ${icons.northEast}</a></div>
    <div class="pieces-grid" data-catalog-grid data-limit="4" data-featured="true">${products.filter((product) => product.featured).slice(0, 4).map(pieceCard).join("")}</div>
  </section>

  <section class="visual-break" data-parallax-frame>
    <img src="/assets/catalog/visit-path.webp" alt="Home & Garden Pro forms displayed along the garden path" width="1080" height="626" loading="lazy" data-parallax-image />
    <div data-reveal><p>Form for open space.</p><a class="light-link" href="/about/">Our point of view ${icons.northEast}</a></div>
  </section>

  <section class="yard-gallery section-shell" aria-labelledby="yard-title" data-section-name="04 / IN THE YARD">
    <div class="section-heading" data-reveal><div><p class="section-number">04 / IN THE YARD</p><span class="animated-rule"></span><h2 id="yard-title">A closer look.</h2></div><a class="motion-link" href="/gallery/">Open the gallery ${icons.northEast}</a></div>
    <div class="yard-mosaic">
      ${homeGallery.map((item, index) => `<button class="yard-item yard-${index + 1}" type="button" data-lightbox-src="${item[0]}" data-lightbox-alt="${item[1]}" data-reveal="${index % 3 === 0 ? "clip" : index % 2 ? "right" : "left"}" style="--delay:${(index % 3) * 70}ms"><img src="${item[0]}" alt="${item[1]}" width="720" height="900" loading="lazy" /><span>View ${icons.northEast}</span></button>`).join("")}
    </div>
  </section>

  <section class="story-split section-shell" data-section-name="04 / OUR STORY">
    <div class="story-copy" data-reveal="left"><p class="section-number">04 / OUR STORY</p><span class="animated-rule"></span><h2>Made in Zimbabwe.<br />Made to belong.</h2><p>The collection is experienced best in person: in daylight, at full scale, with enough room to walk around each silhouette.</p><a class="motion-link" href="/about/">Read our story ${icons.northEast}</a></div>
    <div class="story-image" data-reveal="clip" data-parallax-frame><img src="/assets/catalog/sculptural-lineup.webp" alt="Home & Garden Pro sculptural pieces in natural finishes" width="1080" height="864" loading="lazy" data-parallax-image /></div>
  </section>

  <section class="visit-home section-shell" data-nav-section="visit" data-section-name="05 / VISIT">
    <div data-reveal><p class="section-number">05 / VISIT</p><span class="animated-rule"></span><h2>Come see the<br />real scale.</h2><p>18 Crowhill Road<br />Boxpark, Helensvale<br />Harare</p><a href="tel:+263772302335">+263 77 230 2335</a><div class="button-row"><a class="button dark" href="/visit/">Visit details ${icons.northEast}</a><a class="button line" href="${mapsUrl}" target="_blank" rel="noopener noreferrer">${icons.pin} Google Maps</a></div></div>
    <div class="visit-image" data-reveal="right"><img src="/assets/catalog/visit-display.webp" alt="Home & Garden Pro outdoor display at Boxpark" width="1080" height="864" loading="lazy" /><span>Boxpark / Helensvale</span></div>
  </section>
</main>
<div class="lightbox" role="dialog" aria-modal="true" aria-label="Gallery image viewer" data-lightbox hidden><div class="lightbox-top"><span data-lightbox-count></span><button type="button" aria-label="Close gallery" data-lightbox-close>${icons.close}</button></div><button type="button" aria-label="Previous image" data-lightbox-prev>←</button><figure><img data-lightbox-image alt="" /><figcaption data-lightbox-caption></figcaption></figure><button type="button" aria-label="Next image" data-lightbox-next>→</button></div>
${footer()}</body></html>`;

function collectionPage(categoryKey = "") {
  const category = categories[categoryKey];
  const shown = category ? products.filter((product) => product.category === categoryKey) : products;
  const title = category ? `${category.name} | Home & Garden Pro` : "The collection | Home & Garden Pro";
  const description = category ? category.note : "Discover planters, sculptural pieces, water features and troughs from Home & Garden Pro in Harare.";
  const path = category ? `/collection/${categoryKey}/` : "/collection/";
  return pageShell(`<section class="editorial-hero" data-section-name="01 / COLLECTION"><div data-reveal><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span>${category ? '<a href="/collection/">Collection</a><span>/</span>' : ""}<span>${category?.short || "Collection"}</span></nav><p class="eyebrow">Architectural garden forms</p><h1>${category ? category.name : "Pieces for considered spaces."}</h1><p>${description}</p></div><div class="editorial-hero-image ${category?.fit === "contain" ? "fit-contain" : ""}" data-reveal="clip"><img src="${category?.image || "/assets/catalog/hero-planter-field.webp"}" alt="${category?.name || "Home & Garden Pro collection"}" width="1080" height="900" /></div></section>
${category ? "" : `<section class="forms-section collection-forms section-shell" aria-labelledby="collection-forms"><div class="section-heading" data-reveal><div><p class="section-number">01 / FORM FAMILIES</p><span class="animated-rule"></span><h2 id="collection-forms">Choose by silhouette.</h2></div><p>Begin with the character of the piece, not a filter.</p></div><div class="forms-layout">${categoryTiles()}</div></section>`}
  <section class="collection-edit section-shell" aria-labelledby="collection-edit-title" data-section-name="02 / PIECES"><div class="section-heading" data-reveal><div><p class="section-number">02 / CURRENT EDIT</p><span class="animated-rule"></span><h2 id="collection-edit-title">${category ? category.short : "Selected pieces"}.</h2></div><p>Ask about current finishes and availability.</p></div><div class="pieces-grid collection-pieces" data-catalog-grid data-category="${categoryKey}">${shown.map(pieceCard).join("")}</div></section>
  <section class="quiet-enquiry section-shell" data-reveal><p class="eyebrow">See something that belongs?</p><h2>Ask us about the piece,<br />or see it in daylight.</h2><div><a class="button dark" href="${catalogueUrl}" data-catalogue-link target="_blank" rel="noopener noreferrer">View WhatsApp catalogue ${icons.northEast}</a><a class="motion-link" href="/visit/">Plan a visit ${icons.northEast}</a></div></section>`, { title, description, path, active: "collection", image: category?.image || "/assets/catalog/hero-planter-field.webp", bodyClass: "collection-page" });
}

const galleryItems = [
  ["/assets/catalog/planters-round.webp", "Rounded planters arranged outdoors"],
  ["/assets/catalog/sculptural-leaf.webp", "Open leaf-form garden sculptures"],
  ["/assets/catalog/visit-path.webp", "Long display of garden vessels at Boxpark"],
  ["/assets/catalog/water-bowl.webp", "Circular concrete water feature"],
  ["/assets/catalog/planters-tall.webp", "Tall pale concrete planters"],
  ["/assets/catalog/sculptural-loop.webp", "Looped sculptural concrete forms"],
  ["/assets/catalog/yard-bowls.webp", "Concrete bowls and rounded vessels"],
  ["/assets/catalog/sculptural-lineup.webp", "Sculptural forms in natural finishes"],
  ["/assets/catalog/visit-display.webp", "The outdoor display at Boxpark"],
];

const gallery = pageShell(`<section class="editorial-hero gallery-hero" data-section-name="01 / IN THE YARD"><div data-reveal><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><span>A closer look</span></nav><p class="eyebrow">In the yard</p><h1>Form, texture and scale.</h1><p>A curated view of the collection, finishes and outdoor display at Boxpark.</p></div><div class="editorial-hero-image" data-reveal="clip"><img src="/assets/catalog/hero-yard.webp" alt="Wide view of Home & Garden Pro pieces displayed outside" width="1080" height="400" /></div></section>
<section class="gallery-page-grid section-shell" aria-label="Home and Garden Pro gallery">${galleryItems.map((item, index) => `<button class="gallery-page-item gallery-page-${index + 1}" type="button" data-lightbox-src="${item[0]}" data-lightbox-alt="${item[1]}" data-reveal="${index % 3 === 0 ? "clip" : index % 2 ? "right" : "left"}"><img src="${item[0]}" alt="${item[1]}" width="864" height="1080" loading="lazy" /><span>View ${icons.northEast}</span></button>`).join("")}</section>
<div class="lightbox" role="dialog" aria-modal="true" aria-label="Gallery image viewer" data-lightbox hidden><div class="lightbox-top"><span data-lightbox-count></span><button type="button" aria-label="Close gallery" data-lightbox-close>${icons.close}</button></div><button type="button" aria-label="Previous image" data-lightbox-prev>←</button><figure><img data-lightbox-image alt="" /><figcaption data-lightbox-caption></figcaption></figure><button type="button" aria-label="Next image" data-lightbox-next>→</button></div>`, { title: "A closer look | Home & Garden Pro", description: "A curated gallery of Home & Garden Pro planters, sculptural forms, water features and the Boxpark display.", path: "/gallery/", active: "gallery", image: "/assets/catalog/hero-yard.webp", bodyClass: "gallery-page" });

const about = pageShell(`<section class="story-hero" data-section-name="01 / OUR STORY"><img src="/assets/catalog/visit-path.webp" alt="Home & Garden Pro pieces lining the outdoor display" width="1080" height="626" /><div data-reveal><nav class="breadcrumbs light" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><span>Our story</span></nav><p class="eyebrow">Home &amp; Garden Pro</p><h1>Made in Zimbabwe.<br />Made to belong.</h1></div></section>
<section class="brand-intro section-shell"><p class="section-number" data-reveal>01 / POINT OF VIEW</p><div data-reveal><p class="eyebrow">Form before fuss</p><h2>Outdoor pieces should feel part of the place.</h2></div><p data-reveal>Home &amp; Garden Pro brings together concrete planters, water features, troughs and sculptural forms for gardens and outdoor spaces. The collection is displayed in Harare, where scale, texture and finish can be experienced in person.</p></section>
<section class="story-split section-shell"><div class="story-copy" data-reveal="left"><p class="section-number">02 / SILHOUETTE</p><span class="animated-rule"></span><h2>Strong lines.<br />Quiet surfaces.</h2><p>A tall vessel can frame an entrance. A low basin can settle a courtyard. An open sculptural form can hold a long view without competing with it.</p><a class="motion-link" href="/collection/">Explore the forms ${icons.northEast}</a></div><div class="story-image fit-contain" data-reveal="clip"><img src="/assets/catalog/sculptural-leaf.webp" alt="Open sculptural garden forms" width="863" height="1080" loading="lazy" /></div></section>
<section class="visual-break story-break"><img src="/assets/catalog/sculptural-lineup.webp" alt="Sculptural garden pieces in natural finishes" width="1080" height="864" loading="lazy" /><div data-reveal><p>Objects with presence.</p><a class="light-link" href="/visit/">Experience the collection ${icons.northEast}</a></div></section>`, { title: "Our story | Home & Garden Pro", description: "Home & Garden Pro presents concrete planters, water features, troughs and sculptural garden forms in Harare, Zimbabwe.", path: "/about/", active: "about", image: "/assets/catalog/visit-path.webp", bodyClass: "about-page" });

const visit = pageShell(`<section class="editorial-hero visit-hero" data-section-name="01 / VISIT"><div data-reveal><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><span>Visit</span></nav><p class="eyebrow">Boxpark, Helensvale</p><h1>Come see the real scale.</h1><p>Compare silhouettes, finishes and proportions in person at our outdoor display in Harare.</p><div class="button-row"><a class="button dark" href="${mapsUrl}" target="_blank" rel="noopener noreferrer">${icons.pin} Get directions</a><a class="button line" href="tel:+263772302335">Call us</a></div></div><div class="editorial-hero-image" data-reveal="clip"><img src="/assets/catalog/hero-storefront.webp" alt="Home & Garden Pro storefront at Boxpark, Helensvale" width="1074" height="859" /></div></section>
<section class="visit-details section-shell"><div data-reveal><p class="section-number">01 / ADDRESS</p><span class="animated-rule"></span><h2>18 Crowhill Road<br />Boxpark, Helensvale<br />Harare</h2></div><div data-reveal style="--delay:100ms"><p class="eyebrow">Contact</p><a href="tel:+263772302335">+263 77 230 2335</a><a href="${whatsapp}?text=Hello%20Home%20%26%20Garden%20Pro%2C%20I%27m%20planning%20a%20visit%20to%20Boxpark." target="_blank" rel="noopener">Message on WhatsApp</a></div></section>
<section class="map-contact section-shell" data-reveal><div class="map-copy"><p class="section-number">02 / FIND US</p><span class="animated-rule"></span><h2>Home &amp; Garden Pro</h2><p>Boxpark, Helensvale<br />18 Crowhill Road<br />Harare, Zimbabwe</p><a href="tel:+263772302335">+263 77 230 2335</a><a class="motion-link" href="${mapsUrl}" target="_blank" rel="noopener noreferrer">Get directions ${icons.northEast}</a></div><a class="map-card" href="${mapsUrl}" target="_blank" rel="noopener noreferrer" aria-label="Get directions to Home and Garden Pro at Box Park"><div class="map-grid" aria-hidden="true"></div><span class="map-pin">${icons.pin}</span><span class="map-label">Box Park / 18 Crowhill Road</span></a></section>
<section class="visit-guide section-shell"><div data-reveal="left"><p class="section-number">02 / BEFORE YOU COME</p><span class="animated-rule"></span><h2>Bring a photo<br />of the space.</h2><p>A wide view and a rough sense of the available footprint will make it easier to compare shape and scale when you arrive.</p></div><div class="visit-guide-images" data-reveal="right"><img src="/assets/catalog/yard-planters.webp" alt="Outdoor display of planters" width="1080" height="864" loading="lazy" /><img src="/assets/catalog/yard-bowls.webp" alt="Outdoor display of bowls and vessels" width="1040" height="832" loading="lazy" /></div></section>`, { title: "Visit Home & Garden Pro | Boxpark, Helensvale", description: "Visit Home & Garden Pro at 18 Crowhill Road, Boxpark, Helensvale, Harare. Get directions with Google Maps.", path: "/visit/", active: "visit", image: "/assets/catalog/hero-storefront.webp", bodyClass: "visit-page" });

function productPage(product) {
  const related = products.filter((item) => item.id !== product.id && item.category === product.category);
  const allRelated = (related.length ? related : products.filter((item) => item.id !== product.id)).slice(0, 3);
  const path = `/products/${product.slug || product.id}/`;
  const structured = JSON.stringify({ "@context": "https://schema.org", "@type": "Product", name: product.name, image: product.images, description: product.summary, brand: { "@type": "Brand", name: "Home & Garden Pro" }, url: `${origin}${path}` }).replaceAll("<", "\\u003c");
  const sizes = product.showPrice ? (product.sizes || []).filter((size) => size.label && validPrice(size.price)) : [];
  const initialPrice = sizes.length ? money(sizes[0].price) : priceLabel(product);
  return `${head(`${product.name} | Home & Garden Pro`, `${product.summary} Ask Home & Garden Pro about current finishes and availability.`, path, product.image, "product")}<body class="product-page">${header("pieces")}<main>
  <section class="product-detail" data-product-page data-slug="${product.slug || product.id}" data-section-name="01 / PIECE"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/collection/">Collection</a><span>/</span><span>${product.name}</span></nav><div class="product-gallery"><div class="product-primary fit-contain"><img src="${product.images[0]}" alt="${product.alt}" width="900" height="1100" fetchpriority="high" /></div><div class="product-support">${product.images.slice(1, 3).map((image, index) => `<div class="${index === 0 ? "fit-contain" : ""}"><img src="${image}" alt="${product.name}, view ${index + 2}" width="720" height="900" loading="lazy" /></div>`).join("")}</div></div><aside class="product-info" data-reveal="right"><p class="eyebrow">${product.categoryLabel}</p><h1>${product.name}</h1><p class="product-family">${product.family}</p><p>${product.summary}</p><div class="price-panel"><p>Price range</p><strong data-current-price>${initialPrice}</strong>${sizeOptions(product)}</div><div class="product-actions"><a class="motion-link" href="${catalogueUrl}" data-catalogue-link target="_blank" rel="noopener noreferrer">View WhatsApp catalogue ${icons.northEast}</a><button class="button dark" type="button" data-enquiry-name="${product.name}" data-enquiry-image="${product.image}"${sizes[0] ? ` data-enquiry-size="${sizes[0].label}"` : ""}>Ask about this piece ${icons.northEast}</button><a class="motion-link" href="/visit/">See it at Boxpark ${icons.northEast}</a></div><dl><div><dt>Collection</dt><dd><a href="/collection/${product.category}/">${categories[product.category]?.short || product.categoryLabel}</a></dd></div><div><dt>Availability</dt><dd>Ask for current availability</dd></div></dl></aside></section>
  <section class="related-section section-shell"><div class="section-heading" data-reveal><div><p class="section-number">02 / SIMILAR FORMS</p><span class="animated-rule"></span><h2>Continue looking.</h2></div><a class="motion-link" href="/collection/${product.category}/">View the family ${icons.northEast}</a></div><div class="pieces-grid related-grid">${allRelated.map(pieceCard).join("")}</div></section></main>${footer()}<script type="application/ld+json">${structured}</script></body></html>`;
}

const genericProduct = `${head("Piece | Home & Garden Pro", "Explore a Home & Garden Pro garden piece and ask about current finishes and availability.", "/products/")}<body class="product-page">${header("pieces")}<main><section class="dynamic-product" data-dynamic-product><p class="eyebrow">Loading piece</p><h1>Home &amp; Garden Pro</h1></section></main>${footer()}</body></html>`;

const files = new Map([
  ["index.html", home],
  ["collection/index.html", collectionPage()],
  ...Object.keys(categories).map((key) => [`collection/${key}/index.html`, collectionPage(key)]),
  ["gallery/index.html", gallery],
  ["about/index.html", about],
  ["visit/index.html", visit],
  ["product.html", genericProduct],
  ...products.map((product) => [`products/${product.slug || product.id}/index.html`, productPage(product)]),
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
  "gallery", "about", "visit", "products",
];

for (const entry of publish) {
  await cp(join(root, entry), join(dist, entry), { recursive: true });
}

console.log("Prepared dist for deployment.");
