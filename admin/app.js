const loginView = document.querySelector("#loginView");
const studioView = document.querySelector("#studioView");
const loginForm = document.querySelector("#loginForm");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const loginMessage = document.querySelector("#loginMessage");
const itemList = document.querySelector("#itemList");
const itemTemplate = document.querySelector("#itemTemplate");
const sizeTemplate = document.querySelector("#sizeTemplate");
const saveMessage = document.querySelector("#saveMessage");
const saveButtons = [document.querySelector("#saveButton"), document.querySelector("#saveBarButton")];
const catalogueUrlInput = document.querySelector("#whatsappCatalogUrl");

let items = [];
let settings = {};
let dirty = false;

function slugify(value) {
  return String(value || "product").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "product";
}

function amount(input) {
  const value = Number(input.value);
  return Number.isFinite(value) && value > 0 ? Math.round(value * 100) / 100 : null;
}

function formatMoney(value) {
  return Number.isInteger(value) ? `$${value}` : `$${value.toFixed(2)}`;
}

function markDirty(message = "Unpublished changes") {
  dirty = true;
  saveMessage.textContent = message;
}

function setBusy(busy) {
  saveButtons.forEach((button) => { button.disabled = busy; });
}

async function request(path, options = {}) {
  return fetch(path, {
    credentials: "same-origin",
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
}

function createItem() {
  const now = new Date().toISOString();
  return {
    id: `new-product-${Date.now()}`,
    slug: "new-product",
    name: "New product",
    category: "planters",
    categoryLabel: "Garden piece",
    family: "",
    summary: "",
    image: "/assets/catalog/planters-vessels.webp",
    images: ["/assets/catalog/planters-vessels.webp"],
    alt: "New Home & Garden Pro product",
    sizes: [],
    priceFrom: null,
    priceTo: null,
    showPrice: false,
    visible: false,
    featured: false,
    archived: false,
    createdAt: now,
    updatedAt: now,
  };
}

function sizeValues(card) {
  return [...card.querySelectorAll(".size-row")].map((row, index) => ({
    id: row.dataset.id || `size-${index + 1}`,
    label: row.querySelector(".size-label").value.trim(),
    dimensions: row.querySelector(".size-dimensions").value.trim(),
    price: amount(row.querySelector(".size-price")),
  })).filter((size) => size.label);
}

function updateRange(card) {
  const prices = sizeValues(card).map((size) => size.price).filter((price) => price !== null);
  const fallback = [amount(card.querySelector(".price-from")), amount(card.querySelector(".price-to"))].filter((price) => price !== null);
  const values = prices.length ? prices : fallback;
  const label = card.querySelector(".range-preview");
  if (!values.length) label.textContent = "Ask for current price";
  else if (Math.min(...values) === Math.max(...values)) label.textContent = formatMoney(values[0]);
  else label.textContent = `${formatMoney(Math.min(...values))} – ${formatMoney(Math.max(...values))}`;
}

function renderSize(card, size = {}) {
  const row = sizeTemplate.content.firstElementChild.cloneNode(true);
  row.dataset.id = size.id || `size-${Date.now()}-${card.querySelectorAll(".size-row").length + 1}`;
  row.querySelector(".size-label").value = size.label || "";
  row.querySelector(".size-dimensions").value = size.dimensions || "";
  row.querySelector(".size-price").value = size.price ?? "";
  row.addEventListener("input", () => { markDirty(); updateRange(card); });
  row.querySelector(".remove-size").addEventListener("click", () => {
    row.remove();
    markDirty("Size removed");
    updateRange(card);
  });
  card.querySelector(".size-list").append(row);
}

function collectItems() {
  return [...itemList.querySelectorAll(".editor-card")].map((card, index) => {
    const existing = items.find((item) => item.id === card.dataset.id) || {};
    const name = card.querySelector(".item-name").value.trim();
    const image = card.querySelector(".image-url").value;
    const extraImages = card.querySelector(".item-images").value.split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
    return {
      ...existing,
      id: card.dataset.id || `${slugify(name)}-${index + 1}`,
      slug: existing.slug || slugify(name),
      name,
      category: card.querySelector(".item-category").value.trim(),
      categoryLabel: card.querySelector(".category-label").value.trim(),
      family: card.querySelector(".item-family").value.trim(),
      description: card.querySelector(".item-summary").value.trim(),
      summary: card.querySelector(".item-summary").value.trim(),
      image,
      thumbnail: image,
      featuredImage: image,
      images: [image, ...extraImages.filter((source) => source !== image)],
      alt: card.querySelector(".image-alt").value || name,
      sizes: sizeValues(card),
      priceFrom: amount(card.querySelector(".price-from")),
      priceTo: amount(card.querySelector(".price-to")),
      showPrice: card.querySelector(".show-price").checked,
      visible: card.querySelector(".item-visible").checked,
      featured: card.querySelector(".item-featured").checked,
      archived: card.querySelector(".item-archived").checked,
    };
  });
}

function moveCard(card, direction) {
  const sibling = direction < 0 ? card.previousElementSibling : card.nextElementSibling;
  if (!sibling) return;
  if (direction < 0) itemList.insertBefore(card, sibling);
  else itemList.insertBefore(sibling, card);
  markDirty("Product order changed");
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function compressImage(file) {
  const source = await fileToDataUrl(file);
  const image = new Image();
  image.src = source;
  await image.decode();
  const maxDimension = 1600;
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.naturalWidth * scale);
  canvas.height = Math.round(image.naturalHeight * scale);
  const context = canvas.getContext("2d", { alpha: false });
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/webp", 0.82);
}

async function uploadImage(card, file) {
  const status = card.querySelector(".upload-status");
  status.textContent = "Preparing image...";
  const data = await compressImage(file);
  status.textContent = "Uploading...";
  const response = await request("/api/upload", { method: "POST", body: JSON.stringify({ data, type: "image/webp", filename: file.name }) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Upload failed");
  card.querySelector(".image-url").value = result.url;
  card.querySelector(".item-preview").src = result.url;
  status.textContent = "Image ready to publish";
  markDirty("New image ready");
}

function renderItem(item) {
  const card = itemTemplate.content.firstElementChild.cloneNode(true);
  card.dataset.id = item.id;
  const preview = card.querySelector(".item-preview");
  preview.src = item.image;
  preview.alt = item.alt || item.name;
  card.querySelector(".image-url").value = item.image;
  card.querySelector(".image-alt").value = item.alt || item.name;
  card.querySelector(".item-name").value = item.name;
  card.querySelector(".item-category").value = item.category;
  card.querySelector(".category-label").value = item.categoryLabel || "";
  card.querySelector(".item-family").value = item.family || "";
  card.querySelector(".item-summary").value = item.description || item.summary || "";
  card.querySelector(".item-images").value = (item.images || []).filter((source) => source !== item.image).join("\n");
  card.querySelector(".price-from").value = item.priceFrom ?? "";
  card.querySelector(".price-to").value = item.priceTo ?? "";
  card.querySelector(".item-visible").checked = item.visible !== false;
  card.querySelector(".item-featured").checked = item.featured === true;
  card.querySelector(".item-archived").checked = item.archived === true;
  card.querySelector(".show-price").checked = item.showPrice === true || item.showEstimate === true;
  (item.sizes || []).forEach((size) => renderSize(card, size));
  updateRange(card);

  card.addEventListener("input", () => { markDirty(); updateRange(card); });
  card.addEventListener("change", () => { markDirty(); updateRange(card); });
  card.querySelector(".add-size").addEventListener("click", () => { renderSize(card); markDirty("New size added"); });
  card.querySelector(".move-up").addEventListener("click", () => moveCard(card, -1));
  card.querySelector(".move-down").addEventListener("click", () => moveCard(card, 1));
  card.querySelector(".remove-item").addEventListener("click", () => {
    if (itemList.children.length === 1) return void (saveMessage.textContent = "Keep at least one product");
    card.remove();
    markDirty("Product deleted. Publish changes to confirm.");
  });
  card.querySelector(".image-file").addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try { await uploadImage(card, file); }
    catch (error) { card.querySelector(".upload-status").textContent = error.message; }
    finally { event.target.value = ""; }
  });
  return card;
}

function renderItems() {
  itemList.replaceChildren(...items.map(renderItem));
}

async function openStudio() {
  setBusy(true);
  try {
    const authResponse = await request("/api/auth");
    if (!authResponse.ok) throw new Error("Email or password incorrect.");
    const catalogResponse = await fetch("/api/catalog", { cache: "no-store" });
    if (!catalogResponse.ok) throw new Error("The catalogue is temporarily unavailable.");
    const catalog = await catalogResponse.json();
    items = Array.isArray(catalog.items) ? catalog.items : [];
    settings = catalog.settings || {};
    catalogueUrlInput.value = settings.whatsappCatalogUrl || "";
    renderItems();
    loginView.hidden = true;
    studioView.hidden = false;
    dirty = false;
    saveMessage.textContent = catalog.updatedAt ? `Last published ${new Date(catalog.updatedAt).toLocaleString()}` : "Using the original catalogue";
  } finally { setBusy(false); }
}

async function saveCatalog() {
  const nextItems = collectItems();
  if (nextItems.some((item) => !item.name)) return void (saveMessage.textContent = "Every product needs a name");
  if (nextItems.some((item) => item.showPrice && item.sizes.every((size) => size.price === null) && item.priceFrom === null && item.priceTo === null)) {
    return void (saveMessage.textContent = "Add a price before showing pricing publicly");
  }
  setBusy(true);
  saveMessage.textContent = "Publishing catalogue...";
  try {
    const response = await request("/api/catalog", {
      method: "POST",
      body: JSON.stringify({ items: nextItems, settings: { whatsappCatalogUrl: catalogueUrlInput.value.trim() } }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Publish failed");
    items = result.items;
    settings = result.settings || {};
    dirty = false;
    saveMessage.textContent = `Published ${new Date(result.updatedAt).toLocaleString()}`;
  } catch (error) { saveMessage.textContent = error.message; }
  finally { setBusy(false); }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginMessage.textContent = "Checking access...";
  try {
    const response = await request("/api/auth", { method: "POST", body: JSON.stringify({ email: emailInput.value, password: passwordInput.value }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Email or password incorrect.");
    passwordInput.value = "";
    loginMessage.textContent = "";
    await openStudio();
  } catch {
    loginMessage.textContent = "Email or password incorrect.";
  }
});

document.querySelector("#togglePassword").addEventListener("click", (event) => {
  const show = passwordInput.type === "password";
  passwordInput.type = show ? "text" : "password";
  event.currentTarget.setAttribute("aria-label", show ? "Hide password" : "Show password");
});

document.querySelector("#logoutButton").addEventListener("click", async () => {
  await request("/api/auth", { method: "DELETE", body: "{}" });
  studioView.hidden = true;
  loginView.hidden = false;
  loginForm.reset();
  emailInput.focus();
});

document.querySelector("#addItemButton").addEventListener("click", () => {
  const item = createItem();
  items.push(item);
  itemList.append(renderItem(item));
  markDirty("New product added");
  itemList.lastElementChild.scrollIntoView({ behavior: "smooth", block: "center" });
});

catalogueUrlInput.addEventListener("input", () => markDirty("Site setting changed"));
saveButtons.forEach((button) => button.addEventListener("click", saveCatalog));
window.addEventListener("beforeunload", (event) => { if (dirty) event.preventDefault(); });

openStudio().catch(() => {
  loginView.hidden = false;
  studioView.hidden = true;
});
