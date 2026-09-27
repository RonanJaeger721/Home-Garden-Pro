const loginView = document.querySelector("#loginView");
const studioView = document.querySelector("#studioView");
const loginForm = document.querySelector("#loginForm");
const passwordInput = document.querySelector("#password");
const loginMessage = document.querySelector("#loginMessage");
const itemList = document.querySelector("#itemList");
const template = document.querySelector("#itemTemplate");
const saveMessage = document.querySelector("#saveMessage");
const saveButtons = [document.querySelector("#saveButton"), document.querySelector("#saveBarButton")];

let accessKey = sessionStorage.getItem("hgp-admin-key") || "";
let items = [];
let dirty = false;

function request(path, options = {}) {
  return fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": accessKey,
      ...(options.headers || {}),
    },
  });
}

function setBusy(isBusy) {
  document.body.classList.toggle("busy", isBusy);
  saveButtons.forEach((button) => { button.disabled = isBusy; });
}

function markDirty(message = "Unpublished changes") {
  dirty = true;
  saveMessage.textContent = message;
}

function slugify(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || `item-${Date.now()}`;
}

function createItem(overrides = {}) {
  return {
    id: `item-${Date.now()}`,
    name: "New catalogue item",
    slug: `item-${Date.now()}`,
    category: "planters",
    categoryLabel: "Planter",
    family: "Garden form",
    summary: "",
    image: "/assets/client-round-planters.webp",
    alt: "Home & Garden Pro catalogue item",
    visible: true,
    featured: false,
    estimateMin: null,
    estimateMax: null,
    showEstimate: false,
    ...overrides,
  };
}

function collectItems() {
  return [...itemList.querySelectorAll(".editor-card")].map((card, index) => {
    const amount = (selector) => {
      const value = card.querySelector(selector).value;
      return value === "" ? null : Number(value);
    };
    const name = card.querySelector(".item-name").value.trim();

    const existing = items.find((item) => item.id === card.dataset.id) || {};
    const image = card.querySelector(".image-url").value;
    return {
      ...existing,
      id: card.dataset.id || `${slugify(name)}-${index + 1}`,
      slug: existing.slug || slugify(name),
      name,
      category: card.querySelector(".item-category").value.trim(),
      categoryLabel: card.querySelector(".category-label").value.trim(),
      family: card.querySelector(".item-family").value.trim(),
      summary: card.querySelector(".item-summary").value.trim(),
      image,
      images: Array.isArray(existing.images) && existing.images.length
        ? [image, ...existing.images.filter((source) => source !== image)]
        : [image],
      alt: card.querySelector(".image-alt").value || name,
      visible: card.querySelector(".item-visible").checked,
      featured: card.querySelector(".item-featured").checked,
      estimateMin: amount(".estimate-min"),
      estimateMax: amount(".estimate-max"),
      showEstimate: card.querySelector(".show-estimate").checked,
    };
  });
}

function moveCard(card, direction) {
  const sibling = direction < 0 ? card.previousElementSibling : card.nextElementSibling;
  if (!sibling) return;
  if (direction < 0) itemList.insertBefore(card, sibling);
  else itemList.insertBefore(sibling, card);
  markDirty("Order changed");
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

  const response = await request("/api/upload", {
    method: "POST",
    body: JSON.stringify({ data, type: "image/webp", filename: file.name }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Upload failed");

  card.querySelector(".image-url").value = result.url;
  card.querySelector(".item-preview").src = result.url;
  status.textContent = "Image ready to publish";
  markDirty("New image ready");
}

function renderItem(item) {
  const card = template.content.firstElementChild.cloneNode(true);
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
  card.querySelector(".item-summary").value = item.summary || "";
  card.querySelector(".estimate-min").value = item.estimateMin ?? "";
  card.querySelector(".estimate-max").value = item.estimateMax ?? "";
  card.querySelector(".item-visible").checked = item.visible !== false;
  card.querySelector(".item-featured").checked = item.featured === true;
  card.querySelector(".show-estimate").checked = item.showEstimate === true;

  card.addEventListener("input", () => markDirty());
  card.addEventListener("change", () => markDirty());
  card.querySelector(".move-up").addEventListener("click", () => moveCard(card, -1));
  card.querySelector(".move-down").addEventListener("click", () => moveCard(card, 1));
  card.querySelector(".remove-item").addEventListener("click", () => {
    if (itemList.children.length === 1) {
      saveMessage.textContent = "Keep at least one catalogue item";
      return;
    }
    card.remove();
    markDirty("Item removed");
  });
  card.querySelector(".image-file").addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await uploadImage(card, file);
    } catch (error) {
      card.querySelector(".upload-status").textContent = error.message;
    } finally {
      event.target.value = "";
    }
  });

  return card;
}

function renderItems() {
  itemList.replaceChildren(...items.map(renderItem));
}

async function openStudio() {
  setBusy(true);
  try {
    const authResponse = await request("/api/auth", { method: "POST", body: "{}" });
    if (!authResponse.ok) throw new Error("That access key is not recognised.");

    const catalogResponse = await fetch("/api/catalog", { cache: "no-store" });
    if (!catalogResponse.ok) throw new Error("The catalogue is temporarily unavailable.");
    const catalog = await catalogResponse.json();
    items = Array.isArray(catalog.items) ? catalog.items : [];
    renderItems();
    sessionStorage.setItem("hgp-admin-key", accessKey);
    loginView.hidden = true;
    studioView.hidden = false;
    dirty = false;
    saveMessage.textContent = catalog.updatedAt ? `Last published ${new Date(catalog.updatedAt).toLocaleString()}` : "Using the original catalogue";
  } finally {
    setBusy(false);
  }
}

async function saveCatalog() {
  const nextItems = collectItems();
  if (nextItems.some((item) => !item.name)) {
    saveMessage.textContent = "Every item needs a name";
    return;
  }
  if (nextItems.some((item) => item.showEstimate && item.estimateMin === null && item.estimateMax === null)) {
    saveMessage.textContent = "Add an estimate before making it public";
    return;
  }

  setBusy(true);
  saveMessage.textContent = "Publishing catalogue...";
  try {
    const response = await request("/api/catalog", {
      method: "POST",
      body: JSON.stringify({ items: nextItems }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Publish failed");
    items = result.items;
    dirty = false;
    saveMessage.textContent = `Published ${new Date(result.updatedAt).toLocaleString()}`;
  } catch (error) {
    saveMessage.textContent = error.message;
  } finally {
    setBusy(false);
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginMessage.textContent = "Checking access...";
  accessKey = passwordInput.value;
  try {
    await openStudio();
    loginMessage.textContent = "";
  } catch (error) {
    loginMessage.textContent = error.message;
    accessKey = "";
    sessionStorage.removeItem("hgp-admin-key");
  }
});

document.querySelector("#togglePassword").addEventListener("click", (event) => {
  const show = passwordInput.type === "password";
  passwordInput.type = show ? "text" : "password";
  event.currentTarget.setAttribute("aria-label", show ? "Hide access key" : "Show access key");
});

document.querySelector("#lockButton").addEventListener("click", () => {
  sessionStorage.removeItem("hgp-admin-key");
  accessKey = "";
  studioView.hidden = true;
  loginView.hidden = false;
  passwordInput.value = "";
  passwordInput.focus();
});

document.querySelector("#addItemButton").addEventListener("click", () => {
  const item = createItem();
  itemList.append(renderItem(item));
  markDirty("New item added");
  itemList.lastElementChild.scrollIntoView({ behavior: "smooth", block: "center" });
});

saveButtons.forEach((button) => button.addEventListener("click", saveCatalog));
window.addEventListener("beforeunload", (event) => {
  if (!dirty) return;
  event.preventDefault();
});

if (accessKey) {
  openStudio().catch(() => {
    sessionStorage.removeItem("hgp-admin-key");
    accessKey = "";
    loginView.hidden = false;
    studioView.hidden = true;
  });
}
