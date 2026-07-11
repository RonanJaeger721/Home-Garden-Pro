const root = document.documentElement;
const reveals = document.querySelectorAll("[data-reveal]");
const productButtons = document.querySelectorAll(".product-dot");
const activeImage = document.querySelector("#activeProductImage");
const activeName = document.querySelector("#activeProductName");
const activeText = document.querySelector("#activeProductText");
const activePrice = document.querySelector("#activeProductPrice");

const products = [
  {
    name: "Water feature",
    text: "A low, meditative water piece for courtyards, patios and quiet entrances.",
    price: "US$450.00",
    image: "assets/water-feature-black.jpg",
  },
  {
    name: "Hamilton Black",
    text: "A tall sculptural planter with a strong vertical profile for entrances.",
    price: "US$1,100.00",
    image: "assets/hamilton-black.jpg",
  },
  {
    name: "Curo Trough",
    text: "A clean-lined concrete trough for layered planting and boundary edges.",
    price: "US$300.00",
    image: "assets/curo-trough.jpg",
  },
  {
    name: "Round Planters",
    text: "Grouped vessels that build a soft rhythm across patios and garden walls.",
    price: "US$1,200.00",
    image: "assets/round-planters.jpg",
  },
];

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
);

reveals.forEach((item) => revealObserver.observe(item));

window.addEventListener("pointermove", (event) => {
  root.style.setProperty("--mx", `${event.clientX}px`);
  root.style.setProperty("--my", `${event.clientY}px`);
});

function setProduct(index) {
  const product = products[index];
  activeImage.style.opacity = "0";
  setTimeout(() => {
    activeImage.src = product.image;
    activeImage.alt = product.name;
    activeName.textContent = product.name;
    activeText.textContent = product.text;
    activePrice.textContent = product.price;
    activeImage.style.opacity = "1";
  }, 180);

  productButtons.forEach((button) => {
    button.classList.toggle("is-active", Number(button.dataset.product) === index);
  });
}

productButtons.forEach((button) => {
  button.addEventListener("click", () => setProduct(Number(button.dataset.product)));
});

const studio = document.querySelector("#studio");
let lastActive = 0;

function updateScrollProduct() {
  if (!studio) return;
  const rect = studio.getBoundingClientRect();
  const progress = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / (rect.height + window.innerHeight)));
  const next = Math.min(products.length - 1, Math.floor(progress * products.length));
  if (next !== lastActive) {
    lastActive = next;
    setProduct(next);
  }
}

window.addEventListener("scroll", updateScrollProduct, { passive: true });

const canvas = document.querySelector("#rippleCanvas");
const stage = document.querySelector(".water-stage");
const ctx = canvas.getContext("2d");
let ripples = [];
let width = 0;
let height = 0;
let lastRipple = 0;

function resizeCanvas() {
  const bounds = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = bounds.width;
  height = bounds.height;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function addRipple(x, y, force = 1) {
  ripples.push({ x, y, radius: 8, alpha: 0.55 * force, speed: 2.6 + force });
  if (ripples.length > 22) ripples.shift();
}

function paintWater() {
  ctx.clearRect(0, 0, width, height);
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#f8faf3");
  gradient.addColorStop(0.52, "#ffffff");
  gradient.addColorStop(1, "#e7f1e5");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = "#1f5b37";
  for (let y = 28; y < height; y += 34) {
    ctx.beginPath();
    for (let x = 0; x <= width; x += 18) {
      const wave = Math.sin((x + performance.now() * 0.025) * 0.025 + y * 0.02) * 5;
      if (x === 0) ctx.moveTo(x, y + wave);
      else ctx.lineTo(x, y + wave);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  ripples = ripples.filter((ripple) => ripple.alpha > 0.01);
  ripples.forEach((ripple) => {
    ctx.beginPath();
    ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(31, 91, 55, ${ripple.alpha})`;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ripple.radius += ripple.speed;
    ripple.alpha *= 0.965;
  });

  requestAnimationFrame(paintWater);
}

stage.addEventListener("pointermove", (event) => {
  const now = performance.now();
  if (now - lastRipple < 70) return;
  const rect = stage.getBoundingClientRect();
  addRipple(event.clientX - rect.left, event.clientY - rect.top, 0.72);
  lastRipple = now;
});

stage.addEventListener("pointerdown", (event) => {
  const rect = stage.getBoundingClientRect();
  addRipple(event.clientX - rect.left, event.clientY - rect.top, 1.3);
});

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
addRipple(width * 0.5, height * 0.5, 1);
paintWater();
