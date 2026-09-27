const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const phone = "263772302335";
const categoryLabels = {
  planters: "Planters",
  sculptural: "Sculptural",
  "water-features": "Water features",
  troughs: "Troughs",
};

let catalogue = [];

const escapeHTML = (value = "") => String(value).replace(/[&<>'"]/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
})[character]);

function normalizeProduct(item) {
  const legacy = (item.category || "").toLowerCase();
  let category = item.category;
  if (!categoryLabels[category]) {
    if (legacy.includes("trough")) category = "troughs";
    else if (legacy.includes("water")) category = "water-features";
    else if (legacy.includes("sculpt") || legacy.includes("ornament")) category = "sculptural";
    else category = "planters";
  }
  const slug = item.slug || item.id;
  return {
    ...item,
    slug,
    category,
    categoryLabel: item.categoryLabel || categoryLabels[category] || "Garden piece",
    images: Array.isArray(item.images) && item.images.length ? item.images : [item.image],
    summary: item.summary || "A Home & Garden Pro piece for considered outdoor spaces.",
    family: item.family || item.categoryLabel || "Garden form",
  };
}

function estimateLabel(item) {
  if (!item.showEstimate) return "";
  const format = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
  if (item.estimateMin != null && item.estimateMax != null) return `Est. US$${format(item.estimateMin)}–${format(item.estimateMax)}`;
  if (item.estimateMin != null) return `Est. from US$${format(item.estimateMin)}`;
  if (item.estimateMax != null) return `Est. up to US$${format(item.estimateMax)}`;
  return "";
}

function productCard(item) {
  const estimate = estimateLabel(item);
  return `<article class="product-card" data-product-card data-category="${escapeHTML(item.category)}" data-name="${escapeHTML(item.name.toLowerCase())}">
    <a class="product-image" href="/products/${encodeURIComponent(item.slug)}/"><img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.alt || item.name)}" width="900" height="1100" loading="lazy" decoding="async" /></a>
    <div class="product-meta"><div><p>${escapeHTML(item.categoryLabel)}</p><h2><a href="/products/${encodeURIComponent(item.slug)}/">${escapeHTML(item.name)}</a></h2></div>${estimate ? `<span class="product-estimate">${escapeHTML(estimate)}</span>` : ""}<button class="quick-button" type="button" data-quick-slug="${escapeHTML(item.slug)}">Quick view</button></div>
  </article>`;
}

async function loadCatalogue() {
  const sources = ["/api/catalog", "/data/catalog.json"];
  for (const source of sources) {
    try {
      const response = await fetch(source, { headers: { Accept: "application/json" }, cache: "no-store" });
      if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) continue;
      const data = await response.json();
      if (Array.isArray(data.items)) {
        catalogue = data.items.filter((item) => item.visible !== false).map(normalizeProduct);
        return catalogue;
      }
    } catch {
      // Fall through to the bundled catalogue.
    }
  }
  return [];
}

function initProgress() {
  const bar = document.querySelector(".scroll-progress span");
  const header = document.querySelector("[data-site-header]");
  if (!bar) return;
  let scheduled = false;
  const update = () => {
    const distance = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${distance > 0 ? Math.min(1, window.scrollY / distance) : 0})`;
    header?.classList.toggle("is-scrolled", window.scrollY > 24);
    scheduled = false;
  };
  window.addEventListener("scroll", () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(update);
  }, { passive: true });
  update();
}

function initMenu() {
  const toggle = document.querySelector("[data-menu-toggle]");
  const menu = document.querySelector("[data-mobile-menu]");
  const close = document.querySelector("[data-menu-close]");
  if (!toggle || !menu) return;
  const setOpen = (open) => {
    menu.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("menu-open", open);
    if (open) menu.querySelector("a")?.focus();
    else toggle.focus();
  };
  toggle.addEventListener("click", () => setOpen(menu.hidden));
  close?.addEventListener("click", () => setOpen(false));
  menu.addEventListener("click", (event) => { if (event.target.closest("a")) setOpen(false); });
  window.addEventListener("keydown", (event) => { if (event.key === "Escape" && !menu.hidden) setOpen(false); });
}

function initReveal() {
  const items = [...document.querySelectorAll("[data-reveal]")];
  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: .12, rootMargin: "0px 0px -6% 0px" });
  items.forEach((item) => observer.observe(item));
}

function initHero() {
  const hero = document.querySelector("[data-hero]");
  if (!hero) return;
  const slides = [...hero.querySelectorAll(".hero-slide")];
  const current = hero.querySelector("[data-hero-current]");
  let index = 0;
  let timer;
  let paused = false;
  const show = (next) => {
    index = (next + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => slide.classList.toggle("is-active", slideIndex === index));
    if (current) current.textContent = String(index + 1).padStart(2, "0");
  };
  const play = () => {
    window.clearInterval(timer);
    if (!paused && !reducedMotion.matches) timer = window.setInterval(() => show(index + 1), 5000);
  };
  const manual = (direction) => { paused = true; show(index + direction); window.clearInterval(timer); };
  hero.querySelector("[data-hero-prev]")?.addEventListener("click", () => manual(-1));
  hero.querySelector("[data-hero-next]")?.addEventListener("click", () => manual(1));
  hero.addEventListener("pointerenter", () => window.clearInterval(timer));
  hero.addEventListener("pointerleave", play);
  document.addEventListener("visibilitychange", () => document.hidden ? window.clearInterval(timer) : play());
  play();
}

function initDragRail() {
  const rail = document.querySelector("[data-drag-rail]");
  const track = rail?.querySelector(".run-track");
  if (!rail || !track) return;
  let down = false;
  let start = 0;
  let offset = 0;
  let base = 0;
  const clamp = (value) => Math.max(-(track.scrollWidth - rail.clientWidth), Math.min(0, value));
  rail.addEventListener("pointerdown", (event) => {
    down = true;
    start = event.clientX;
    base = offset;
    rail.classList.add("is-dragging");
    track.style.animation = "none";
    rail.setPointerCapture(event.pointerId);
  });
  rail.addEventListener("pointermove", (event) => {
    if (!down) return;
    offset = clamp(base + event.clientX - start);
    track.style.transform = `translateX(${offset}px)`;
  });
  const release = () => { down = false; rail.classList.remove("is-dragging"); };
  rail.addEventListener("pointerup", release);
  rail.addEventListener("pointercancel", release);
  rail.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    track.style.animation = "none";
    offset = clamp(offset + (event.key === "ArrowLeft" ? 220 : -220));
    track.style.transform = `translateX(${offset}px)`;
  });
}

async function hydrateCatalogues() {
  await loadCatalogue();
  if (!catalogue.length) return;
  document.querySelectorAll("[data-catalog-grid]").forEach((grid) => {
    let items = catalogue;
    const category = grid.dataset.category;
    if (category) items = items.filter((item) => item.category === category);
    if (grid.dataset.featured === "true") items = items.filter((item) => item.featured);
    if (grid.dataset.limit) items = items.slice(0, Number(grid.dataset.limit));
    grid.innerHTML = items.map(productCard).join("");
  });
  initCatalogueFilters();
  initQuickView();
  hydrateDynamicProduct();
}

function initCatalogueFilters() {
  document.querySelectorAll("[data-catalogue]").forEach((section) => {
    const search = section.querySelector("[data-catalog-search]");
    const buttons = [...section.querySelectorAll("[data-filter]")];
    const cards = [...section.querySelectorAll("[data-product-card]")];
    const count = section.querySelector("[data-result-count]");
    const empty = section.querySelector("[data-empty-state]");
    let active = buttons.find((button) => button.getAttribute("aria-pressed") === "true")?.dataset.filter || section.dataset.category || "all";
    const apply = () => {
      const term = search?.value.trim().toLowerCase() || "";
      let visible = 0;
      cards.forEach((card) => {
        const matchFilter = active === "all" || card.dataset.category === active;
        const matchSearch = !term || card.dataset.name.includes(term);
        const show = matchFilter && matchSearch;
        card.hidden = !show;
        if (show) visible += 1;
      });
      if (count) count.textContent = visible;
      if (empty) empty.hidden = visible !== 0;
    };
    buttons.forEach((button) => button.addEventListener("click", () => {
      active = button.dataset.filter;
      buttons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      apply();
    }));
    search?.addEventListener("input", apply);
    apply();
  });
}

function initQuickView() {
  const modal = document.querySelector("[data-quick-view]");
  const content = modal?.querySelector("[data-quick-content]");
  if (!modal || !content || modal.dataset.ready) return;
  modal.dataset.ready = "true";
  let opener;
  const close = () => {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    opener?.focus();
  };
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-quick-slug]");
    if (!button) return;
    const item = catalogue.find((product) => product.slug === button.dataset.quickSlug);
    if (!item) return;
    opener = button;
    const message = encodeURIComponent(`Hello Home & Garden Pro, I'm interested in the ${item.name}. Could you tell me about current finishes and availability?`);
    content.innerHTML = `<div class="quick-layout"><img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.alt || item.name)}" /><div><p class="eyebrow">${escapeHTML(item.categoryLabel)}</p><h2 id="quickViewTitle">${escapeHTML(item.name)}</h2><p>${escapeHTML(item.summary)}</p>${estimateLabel(item) ? `<p>${escapeHTML(estimateLabel(item))}</p>` : ""}<a class="button dark" href="https://wa.me/${phone}?text=${message}" target="_blank" rel="noopener">Ask about this piece</a><a class="text-link" href="/products/${encodeURIComponent(item.slug)}/">View full details →</a></div></div>`;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    modal.querySelector(".modal-close")?.focus();
  });
  modal.querySelectorAll("[data-quick-close]").forEach((element) => element.addEventListener("click", close));
  window.addEventListener("keydown", (event) => { if (event.key === "Escape" && !modal.hidden) close(); });
}

function initLightbox() {
  const modal = document.querySelector("[data-lightbox]");
  const buttons = [...document.querySelectorAll("[data-lightbox-src]")];
  if (!modal || !buttons.length) return;
  const image = modal.querySelector("[data-lightbox-image]");
  const caption = modal.querySelector("[data-lightbox-caption]");
  const count = modal.querySelector("[data-lightbox-count]");
  let index = 0;
  let opener;
  let touchStart = 0;
  const show = (next) => {
    index = (next + buttons.length) % buttons.length;
    image.src = buttons[index].dataset.lightboxSrc;
    image.alt = buttons[index].dataset.lightboxAlt;
    caption.textContent = buttons[index].dataset.lightboxAlt;
    count.textContent = `${String(index + 1).padStart(2, "0")} / ${String(buttons.length).padStart(2, "0")}`;
  };
  const open = (button) => {
    opener = button;
    show(buttons.indexOf(button));
    modal.hidden = false;
    document.body.classList.add("modal-open");
    modal.querySelector("[data-lightbox-close]").focus();
  };
  const close = () => { modal.hidden = true; document.body.classList.remove("modal-open"); opener?.focus(); };
  buttons.forEach((button) => button.addEventListener("click", () => open(button)));
  modal.querySelector("[data-lightbox-close]").addEventListener("click", close);
  modal.querySelector("[data-lightbox-prev]").addEventListener("click", () => show(index - 1));
  modal.querySelector("[data-lightbox-next]").addEventListener("click", () => show(index + 1));
  modal.addEventListener("touchstart", (event) => { touchStart = event.touches[0].clientX; }, { passive: true });
  modal.addEventListener("touchend", (event) => {
    const distance = event.changedTouches[0].clientX - touchStart;
    if (Math.abs(distance) > 55) show(index + (distance < 0 ? 1 : -1));
  }, { passive: true });
  window.addEventListener("keydown", (event) => {
    if (modal.hidden) return;
    if (event.key === "Escape") close();
    if (event.key === "ArrowLeft") show(index - 1);
    if (event.key === "ArrowRight") show(index + 1);
  });
}

function hydrateDynamicProduct() {
  const container = document.querySelector("[data-dynamic-product]");
  if (!container) return;
  const querySlug = new URLSearchParams(window.location.search).get("slug");
  const pathSlug = window.location.pathname.split("/").filter(Boolean).at(-1);
  const slug = querySlug || pathSlug;
  const item = catalogue.find((product) => product.slug === slug);
  if (!item) {
    container.innerHTML = '<p class="eyebrow">Piece not found</p><h1>That form is no longer in the catalogue.</h1><a class="button dark" href="/collection/">Browse the collection</a>';
    return;
  }
  const message = encodeURIComponent(`Hello Home & Garden Pro, I'm interested in the ${item.name}. Could you tell me about current finishes and availability?`);
  container.className = "product-detail";
  container.innerHTML = `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/collection/">Collection</a><span>/</span><span>${escapeHTML(item.name)}</span></nav><div class="product-gallery">${item.images.map((source, index) => `<img src="${escapeHTML(source)}" alt="${escapeHTML(index ? `${item.name}, view ${index + 1}` : item.alt || item.name)}" width="900" height="1100" />`).join("")}</div><aside class="product-info"><p class="eyebrow">${escapeHTML(item.categoryLabel)}</p><h1>${escapeHTML(item.name)}</h1><p class="product-family">${escapeHTML(item.family)}</p><p>${escapeHTML(item.summary)}</p>${estimateLabel(item) ? `<p>${escapeHTML(estimateLabel(item))}</p>` : ""}<div class="product-actions"><a class="button dark" href="https://wa.me/${phone}?text=${message}" target="_blank" rel="noopener">Ask about this piece</a><a class="button line" href="/visit/">See it at Boxpark</a></div></aside>`;
  document.title = `${item.name} | Home & Garden Pro`;
}

initProgress();
initMenu();
initReveal();
initHero();
initDragRail();
initLightbox();
hydrateCatalogues();
