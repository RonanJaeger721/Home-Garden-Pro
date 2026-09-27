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

function pieceCard(item, index = 0) {
  return `<article class="piece-card" data-product-card data-category="${escapeHTML(item.category)}" data-name="${escapeHTML(item.name.toLowerCase())}" data-reveal="${index % 2 ? "right" : "left"}" style="--delay:${(index % 4) * 70}ms">
    <a class="piece-image fit-contain" href="/products/${encodeURIComponent(item.slug)}/"><img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.alt || item.name)}" width="864" height="1080" loading="lazy" decoding="async" /></a>
    <div class="piece-meta"><p>${escapeHTML(item.categoryLabel)}</p><h3><a href="/products/${encodeURIComponent(item.slug)}/">${escapeHTML(item.name)}</a></h3><a class="motion-link" href="/products/${encodeURIComponent(item.slug)}/">View piece <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg></a></div>
  </article>`;
}

async function loadCatalogue() {
  for (const source of ["/api/catalog", "/data/catalog.json"]) {
    try {
      const response = await fetch(source, { headers: { Accept: "application/json" }, cache: "no-store" });
      if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) continue;
      const data = await response.json();
      if (Array.isArray(data.items)) {
        catalogue = data.items.filter((item) => item.visible !== false).map(normalizeProduct);
        return catalogue;
      }
    } catch {
      // The bundled catalogue remains available when the managed endpoint is offline.
    }
  }
  return [];
}

function initProgressAndNavigation() {
  const bar = document.querySelector(".scroll-progress span");
  const header = document.querySelector("[data-site-header]");
  const marker = document.querySelector("[data-section-marker]");
  const sections = [...document.querySelectorAll("[data-section-name]")];
  let lastY = window.scrollY;
  let target = 0;
  let current = 0;
  let frame = 0;

  const animateProgress = () => {
    current += (target - current) * 0.18;
    if (bar) bar.style.transform = `scaleX(${current})`;
    if (Math.abs(target - current) > 0.001) frame = requestAnimationFrame(animateProgress);
    else frame = 0;
  };

  const updateSection = () => {
    if (!marker || !sections.length) return;
    const probe = window.innerHeight * 0.42;
    let active = sections[0];
    sections.forEach((section) => {
      if (section.getBoundingClientRect().top <= probe) active = section;
    });
    marker.textContent = active.dataset.sectionName;
  };

  const update = () => {
    const y = Math.max(0, window.scrollY);
    const distance = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    target = Math.min(1, y / distance);
    if (!frame) frame = requestAnimationFrame(animateProgress);

    if (header && !document.body.classList.contains("menu-open")) {
      const delta = y - lastY;
      header.classList.toggle("is-scrolled", y > 24);
      if (y < 100 || delta < -4) header.classList.remove("is-hidden");
      else if (delta > 7) header.classList.add("is-hidden");
    }
    lastY = y;
    updateSection();
  };

  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update, { passive: true });
  update();
}

function initMenu() {
  const toggle = document.querySelector("[data-menu-toggle]");
  const menu = document.querySelector("[data-mobile-menu]");
  const close = document.querySelector("[data-menu-close]");
  const header = document.querySelector("[data-site-header]");
  if (!toggle || !menu) return;
  const setOpen = (open) => {
    menu.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("menu-open", open);
    header?.classList.remove("is-hidden");
    if (open) menu.querySelector("a")?.focus();
    else toggle.focus();
  };
  toggle.addEventListener("click", () => setOpen(menu.hidden));
  close?.addEventListener("click", () => setOpen(false));
  menu.addEventListener("click", (event) => { if (event.target.closest("a")) setOpen(false); });
  window.addEventListener("keydown", (event) => { if (event.key === "Escape" && !menu.hidden) setOpen(false); });
}

function initReveal(scope = document) {
  const items = [...scope.querySelectorAll("[data-reveal]:not([data-reveal-ready])")];
  items.forEach((item) => item.dataset.revealReady = "true");
  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }
  const clipped = items.filter((item) => item.dataset.reveal === "clip");
  const standard = items.filter((item) => item.dataset.reveal !== "clip");
  const clipParents = [...new Set(clipped.map((item) => item.parentElement))];
  const clipObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      clipped.filter((item) => item.parentElement === entry.target).forEach((item) => item.classList.add("is-visible"));
      clipObserver.unobserve(entry.target);
    });
  }, { threshold: .08, rootMargin: "0px 0px -7% 0px" });
  clipParents.forEach((parent) => clipObserver.observe(parent));
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: .12, rootMargin: "0px 0px -7% 0px" });
  standard.forEach((item) => observer.observe(item));
}

function initHero() {
  const hero = document.querySelector("[data-hero]");
  if (!hero) return;
  const slides = [...hero.querySelectorAll(".hero-slide")];
  const cycle = hero.querySelector(".hero-cycle");
  if (slides.length < 2 || reducedMotion.matches) return;
  let index = 0;
  let timer;
  const resetCycle = () => {
    if (!cycle) return;
    cycle.classList.add("is-reset");
    void cycle.offsetWidth;
    cycle.classList.remove("is-reset");
  };
  const showNext = () => {
    index = (index + 1) % slides.length;
    slides.forEach((slide, slideIndex) => slide.classList.toggle("is-active", slideIndex === index));
    resetCycle();
  };
  const play = () => {
    window.clearInterval(timer);
    timer = window.setInterval(showNext, 5000);
  };
  document.addEventListener("visibilitychange", () => document.hidden ? window.clearInterval(timer) : play());
  play();
}

function initMediaRotator() {
  document.querySelectorAll("[data-media-rotator]").forEach((section) => {
    const images = [...section.querySelectorAll(".media-frame > img")];
    if (images.length < 2 || reducedMotion.matches) return;
    let index = 0;
    window.setInterval(() => {
      index = (index + 1) % images.length;
      images.forEach((image, imageIndex) => image.classList.toggle("is-active", imageIndex === index));
    }, 5200);
  });
}

function initDragRail() {
  const rail = document.querySelector("[data-drag-rail]");
  const track = rail?.querySelector(".run-track");
  if (!rail || !track) return;
  let down = false;
  let startX = 0;
  let startScroll = 0;
  let resumeTimer;
  const pause = () => { track.style.animationPlayState = "paused"; window.clearTimeout(resumeTimer); };
  const resume = () => {
    resumeTimer = window.setTimeout(() => {
      if (!reducedMotion.matches) track.style.animationPlayState = "running";
    }, 1800);
  };
  rail.addEventListener("pointerdown", (event) => {
    down = true;
    startX = event.clientX;
    startScroll = rail.scrollLeft;
    rail.classList.add("is-dragging");
    pause();
    rail.setPointerCapture(event.pointerId);
  });
  rail.addEventListener("pointermove", (event) => {
    if (!down) return;
    rail.scrollLeft = startScroll - (event.clientX - startX);
  });
  const release = () => { down = false; rail.classList.remove("is-dragging"); resume(); };
  rail.addEventListener("pointerup", release);
  rail.addEventListener("pointercancel", release);
  rail.addEventListener("pointerenter", pause);
  rail.addEventListener("pointerleave", () => { if (!down) resume(); });
  rail.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    pause();
    rail.scrollBy({ left: event.key === "ArrowLeft" ? -210 : 210, behavior: reducedMotion.matches ? "auto" : "smooth" });
    resume();
  });
}

function initSpaceSelector() {
  document.querySelectorAll("[data-space-selector]").forEach((section) => {
    const buttons = [...section.querySelectorAll("[data-space-option]")];
    const images = [...section.querySelectorAll("[data-space-image]")];
    const note = section.querySelector("[data-space-note]:not(button)");
    const select = (button) => {
      const key = button.dataset.spaceOption;
      buttons.forEach((item) => item.setAttribute("aria-selected", String(item === button)));
      images.forEach((image) => image.classList.toggle("is-active", image.dataset.spaceImage === key));
      if (note) note.textContent = button.dataset.spaceNote;
    };
    buttons.forEach((button) => {
      button.addEventListener("mouseenter", () => select(button));
      button.addEventListener("focus", () => select(button));
      button.addEventListener("click", () => select(button));
    });
  });
}

function initParallax() {
  const frames = [...document.querySelectorAll("[data-parallax-frame]")];
  if (!frames.length || reducedMotion.matches || window.innerWidth < 821) return;
  let scheduled = false;
  const update = () => {
    frames.forEach((frame) => {
      const image = frame.querySelector("[data-parallax-image]");
      if (!image) return;
      const rect = frame.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / (window.innerHeight + rect.height)));
      image.style.setProperty("--parallax-y", `${(progress - .5) * -36}px`);
    });
    scheduled = false;
  };
  window.addEventListener("scroll", () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(update);
  }, { passive: true });
  update();
}

async function hydrateCatalogues() {
  await loadCatalogue();
  if (!catalogue.length) return;
  document.querySelectorAll("[data-catalog-grid]").forEach((grid) => {
    let items = catalogue;
    if (grid.dataset.category) items = items.filter((item) => item.category === grid.dataset.category);
    if (grid.dataset.featured === "true") items = items.filter((item) => item.featured);
    if (grid.dataset.limit) items = items.slice(0, Number(grid.dataset.limit));
    grid.innerHTML = items.map(pieceCard).join("");
    initReveal(grid);
  });
  hydrateDynamicProduct();
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

function initEnquiryModal() {
  const modal = document.querySelector("[data-enquiry-modal]");
  const content = modal?.querySelector("[data-enquiry-content]");
  if (!modal || !content) return;
  let opener;
  const close = () => {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    opener?.focus();
  };
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-enquiry-name]");
    if (!button) return;
    opener = button;
    const name = button.dataset.enquiryName;
    const thumbnail = button.dataset.enquiryImage;
    const message = `Hello Home & Garden Pro, I'm interested in the ${name}. Could you tell me about current finishes and availability?`;
    content.innerHTML = `<div class="enquiry-content"><div class="enquiry-piece"><img src="${escapeHTML(thumbnail)}" alt="${escapeHTML(name)}" /><div><p class="eyebrow">Piece enquiry</p><h2 id="enquiryTitle">${escapeHTML(name)}</h2></div></div><p class="message-preview">${escapeHTML(message)}</p><a class="button dark" href="https://wa.me/${phone}?text=${encodeURIComponent(message)}" target="_blank" rel="noopener">Continue to WhatsApp <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg></a></div>`;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    modal.querySelector(".modal-close")?.focus();
  });
  modal.querySelectorAll("[data-enquiry-close]").forEach((element) => element.addEventListener("click", close));
  window.addEventListener("keydown", (event) => { if (event.key === "Escape" && !modal.hidden) close(); });
}

function hydrateDynamicProduct() {
  const container = document.querySelector("[data-dynamic-product]");
  if (!container) return;
  const querySlug = new URLSearchParams(window.location.search).get("slug");
  const pathSlug = window.location.pathname.split("/").filter(Boolean).at(-1);
  const slug = querySlug || pathSlug;
  const item = catalogue.find((product) => product.slug === slug);
  if (!item) {
    container.innerHTML = '<p class="eyebrow">Piece not found</p><h1>That form is no longer in the collection.</h1><a class="button dark" href="/collection/">Explore the collection</a>';
    return;
  }
  container.className = "product-detail";
  container.innerHTML = `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/collection/">Collection</a><span>/</span><span>${escapeHTML(item.name)}</span></nav><div class="product-gallery"><div class="product-primary fit-contain"><img src="${escapeHTML(item.images[0])}" alt="${escapeHTML(item.alt || item.name)}" width="900" height="1100" /></div><div class="product-support">${item.images.slice(1,3).map((source, index) => `<div class="${index === 0 ? "fit-contain" : ""}"><img src="${escapeHTML(source)}" alt="${escapeHTML(`${item.name}, view ${index + 2}`)}" width="720" height="900" /></div>`).join("")}</div></div><aside class="product-info is-visible"><p class="eyebrow">${escapeHTML(item.categoryLabel)}</p><h1>${escapeHTML(item.name)}</h1><p class="product-family">${escapeHTML(item.family)}</p><p>${escapeHTML(item.summary)}</p><div class="product-actions"><button class="button dark" type="button" data-enquiry-name="${escapeHTML(item.name)}" data-enquiry-image="${escapeHTML(item.image)}">Ask about this piece</button><a class="motion-link" href="/visit/">See it at Boxpark →</a></div></aside>`;
  document.title = `${item.name} | Home & Garden Pro`;
}

initProgressAndNavigation();
initMenu();
initReveal();
initHero();
initMediaRotator();
initDragRail();
initSpaceSelector();
initParallax();
initLightbox();
initEnquiryModal();
hydrateCatalogues();
