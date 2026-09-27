const root = document.documentElement;
const body = document.body;
const loader = document.querySelector(".page-loader");
const header = document.querySelector(".site-header");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

body.classList.add("loading");

function finishLoading() {
  window.setTimeout(() => {
    loader?.classList.add("is-hidden");
    body.classList.remove("loading");
  }, reducedMotion.matches ? 0 : 650);
}

if (document.readyState === "complete") {
  finishLoading();
} else {
  window.addEventListener("load", finishLoading, { once: true });
}

const revealItems = [...document.querySelectorAll("[data-reveal]")];

if ("IntersectionObserver" in window && !reducedMotion.matches) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const siblings = [...entry.target.parentElement.querySelectorAll("[data-reveal]")];
        const order = Math.max(0, siblings.indexOf(entry.target));
        entry.target.style.transitionDelay = Math.min(order, 4) * 70 + "ms";
        entry.target.classList.add("in-view");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.14, rootMargin: "0px 0px -7% 0px" },
  );

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("in-view"));
}

let ticking = false;

function updateOnScroll() {
  const scrollY = window.scrollY;
  header?.classList.toggle("is-scrolled", scrollY > 32);

  if (!reducedMotion.matches && window.innerWidth > 640) {
    const shift = Math.min(72, scrollY * 0.09);
    root.style.setProperty("--hero-shift", shift + "px");
  }

  ticking = false;
}

window.addEventListener(
  "scroll",
  () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateOnScroll);
  },
  { passive: true },
);

updateOnScroll();

const catalogueList = document.querySelector("#catalogueList");

function estimateLabel(item) {
  if (!item.showEstimate) return "";
  const minimum = Number.isFinite(Number(item.estimateMin)) ? Number(item.estimateMin) : null;
  const maximum = Number.isFinite(Number(item.estimateMax)) ? Number(item.estimateMax) : null;
  const money = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);

  if (minimum !== null && maximum !== null) return `Est. US$${money(minimum)}–${money(maximum)}`;
  if (minimum !== null) return `Est. from US$${money(minimum)}`;
  if (maximum !== null) return `Est. up to US$${money(maximum)}`;
  return "";
}

function createCatalogueItem(item, index) {
  const link = document.createElement("a");
  const enquiry = `Hello, I'm interested in the ${item.name}. Could you tell me about current availability?`;
  link.className = "collection-item";
  link.href = `https://wa.me/263772302335?text=${encodeURIComponent(enquiry)}`;

  const number = document.createElement("span");
  number.className = "item-number";
  number.textContent = String(index + 1).padStart(2, "0");

  const thumb = document.createElement("span");
  thumb.className = "item-thumb";
  const image = document.createElement("img");
  image.src = item.image || "assets/client-round-planters.webp";
  image.alt = item.alt || item.name;
  image.width = 1080;
  image.height = 1080;
  image.loading = "lazy";
  image.decoding = "async";
  image.addEventListener("error", () => {
    image.src = "assets/client-round-planters.webp";
  }, { once: true });
  thumb.append(image);

  const name = document.createElement("span");
  name.className = "item-name";
  name.append(document.createTextNode(item.name));
  const category = document.createElement("small");
  category.textContent = item.category || "Garden piece";
  name.append(category);

  link.append(number, thumb, name);

  const estimate = estimateLabel(item);
  if (estimate) {
    const price = document.createElement("span");
    price.className = "item-estimate";
    price.textContent = estimate;
    link.append(price);
  }

  const arrow = document.createElement("span");
  arrow.className = "item-arrow";
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "↗";
  link.append(arrow);
  return link;
}

async function loadCatalogue() {
  if (!catalogueList) return;

  try {
    const response = await fetch("/api/catalog", { headers: { Accept: "application/json" } });
    if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) return;
    const catalog = await response.json();
    const visibleItems = Array.isArray(catalog.items) ? catalog.items.filter((item) => item.visible !== false) : [];
    if (!visibleItems.length) return;
    catalogueList.replaceChildren(...visibleItems.map(createCatalogueItem));
  } catch {
    // Keep the source catalogue in place if the live endpoint is unavailable.
  }
}

loadCatalogue();

const field = document.querySelector("#rippleField");
const canvas = document.querySelector("#rippleCanvas");
const context = canvas?.getContext("2d");

if (field && canvas && context) {
  let width = 0;
  let height = 0;
  let ripples = [];
  let lastRipple = 0;
  let frameId = 0;

  function resizeCanvas() {
    const bounds = field.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = bounds.width;
    height = bounds.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function addRipple(x, y, strength = 1) {
    ripples.push({
      x,
      y,
      radius: 8,
      alpha: 0.34 * strength,
      speed: 1.8 + strength * 0.8,
    });

    if (ripples.length > 18) ripples.shift();
  }

  function drawWater(time = 0) {
    context.clearRect(0, 0, width, height);

    const wash = context.createLinearGradient(0, 0, width, height);
    wash.addColorStop(0, "rgba(31, 81, 59, 0.45)");
    wash.addColorStop(0.55, "rgba(9, 47, 38, 0.08)");
    wash.addColorStop(1, "rgba(87, 126, 104, 0.22)");
    context.fillStyle = wash;
    context.fillRect(0, 0, width, height);

    context.lineWidth = 0.8;
    for (let row = 42; row < height; row += 54) {
      context.beginPath();
      for (let x = -20; x <= width + 20; x += 20) {
        const wave = Math.sin(x * 0.018 + row * 0.03 + time * 0.00035) * 4;
        if (x === -20) context.moveTo(x, row + wave);
        else context.lineTo(x, row + wave);
      }
      context.strokeStyle = "rgba(205, 229, 215, 0.075)";
      context.stroke();
    }

    ripples = ripples.filter((ripple) => ripple.alpha > 0.008);
    ripples.forEach((ripple) => {
      context.beginPath();
      context.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
      context.strokeStyle = "rgba(214, 235, 222, " + ripple.alpha + ")";
      context.lineWidth = 1.2;
      context.stroke();
      ripple.radius += ripple.speed;
      ripple.alpha *= 0.97;
    });

    if (!reducedMotion.matches) frameId = requestAnimationFrame(drawWater);
  }

  function rippleFromEvent(event, strength) {
    const bounds = field.getBoundingClientRect();
    addRipple(event.clientX - bounds.left, event.clientY - bounds.top, strength);
  }

  field.addEventListener("pointermove", (event) => {
    if (reducedMotion.matches) return;
    const now = performance.now();
    if (now - lastRipple < 90) return;
    rippleFromEvent(event, 0.72);
    lastRipple = now;
  });

  field.addEventListener("pointerdown", (event) => rippleFromEvent(event, 1.4));
  window.addEventListener("resize", resizeCanvas);

  resizeCanvas();
  addRipple(width * 0.5, height * 0.5, 1.6);
  drawWater();

  reducedMotion.addEventListener("change", () => {
    cancelAnimationFrame(frameId);
    drawWater();
  });
}
