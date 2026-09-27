import { list, put } from "@vercel/blob";
import { isAuthorized, reject } from "./_auth.js";
import { defaultCatalog } from "./_catalog-default.js";

const CATALOG_PATH = "catalog/current.json";

function normalizeText(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalizeAmount(value) {
  if (value === null || value === "" || value === undefined) return null;
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) / 100 : null;
}

function normalizeUrl(value, fallback = "") {
  const url = normalizeText(value, 500);
  if (!url) return fallback;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" ? parsed.toString() : fallback;
  } catch {
    return fallback;
  }
}

function normalizeSizes(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 20).map((size, index) => {
    const label = normalizeText(size?.label, 60);
    if (!label) return null;
    return {
      id: normalizeText(size?.id, 80) || `size-${index + 1}`,
      label,
      dimensions: normalizeText(size?.dimensions, 120),
      price: normalizeAmount(size?.price),
    };
  }).filter(Boolean);
}

function derivePriceRange(item, sizes) {
  const sizePrices = sizes.map((size) => size.price).filter((price) => price !== null);
  const entered = [normalizeAmount(item?.priceFrom ?? item?.estimateMin), normalizeAmount(item?.priceTo ?? item?.estimateMax)]
    .filter((price) => price !== null);
  const prices = sizePrices.length ? sizePrices : entered;
  if (!prices.length) return { priceFrom: null, priceTo: null };
  return { priceFrom: Math.min(...prices), priceTo: Math.max(...prices) };
}

function normalizeItem(item, index) {
  const name = normalizeText(item?.name, 80);
  if (!name) return null;
  const fallbackId = `item-${Date.now()}-${index}`;
  const id = (normalizeText(item?.id, 96) || fallbackId)
    .toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || fallbackId;
  const slug = (normalizeText(item?.slug, 96) || id)
    .toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || id;
  const image = normalizeText(item?.image || item?.thumbnail || item?.featuredImage, 500);
  const images = Array.isArray(item?.images)
    ? item.images.map((source) => normalizeText(source, 500)).filter(Boolean).slice(0, 8)
    : [image].filter(Boolean);
  const sizes = normalizeSizes(item?.sizes);
  const range = derivePriceRange(item, sizes);
  const now = new Date().toISOString();

  return {
    id,
    slug,
    name,
    category: normalizeText(item?.category, 80) || "planters",
    categoryLabel: normalizeText(item?.categoryLabel, 80),
    family: normalizeText(item?.family, 100),
    description: normalizeText(item?.description || item?.summary, 600),
    summary: normalizeText(item?.summary || item?.description, 320),
    image,
    thumbnail: normalizeText(item?.thumbnail, 500) || image,
    featuredImage: normalizeText(item?.featuredImage, 500) || image,
    images: images.length ? images : [image].filter(Boolean),
    alt: normalizeText(item?.alt, 140) || name,
    sizes,
    priceFrom: range.priceFrom,
    priceTo: range.priceTo,
    showPrice: item?.showPrice === true || item?.showEstimate === true,
    whatsappCatalogUrl: normalizeUrl(item?.whatsappCatalogUrl),
    visible: item?.visible !== false,
    archived: item?.archived === true,
    featured: item?.featured === true,
    createdAt: normalizeText(item?.createdAt, 40) || now,
    updatedAt: now,
  };
}

function normalizeSettings(value) {
  return {
    whatsappCatalogUrl: normalizeUrl(
      value?.whatsappCatalogUrl,
      defaultCatalog.settings?.whatsappCatalogUrl || "",
    ),
  };
}

function normalizeCatalog(source) {
  const items = Array.isArray(source?.items) ? source.items.map(normalizeItem).filter(Boolean) : [];
  return {
    version: 3,
    updatedAt: source?.updatedAt || null,
    settings: normalizeSettings(source?.settings),
    items,
  };
}

function publicCatalog(catalog) {
  return {
    ...catalog,
    items: catalog.items.filter((item) => item.visible && !item.archived).map((item) => item.showPrice ? item : {
      ...item,
      sizes: item.sizes.map((size) => ({ ...size, price: null })),
      priceFrom: null,
      priceTo: null,
    }),
  };
}

async function readCatalog() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return normalizeCatalog(defaultCatalog);
  const { blobs } = await list({ prefix: CATALOG_PATH, limit: 1 });
  const current = blobs.find((blob) => blob.pathname === CATALOG_PATH);
  if (!current) return normalizeCatalog(defaultCatalog);

  const result = await fetch(current.url, { cache: "no-store" });
  if (!result.ok) throw new Error("Unable to read catalogue");
  const stored = await result.json();
  const defaultsById = new Map(defaultCatalog.items.map((item) => [item.id, item]));
  return normalizeCatalog({
    ...stored,
    settings: { ...defaultCatalog.settings, ...stored.settings },
    items: Array.isArray(stored.items)
      ? stored.items.map((item) => ({ ...defaultsById.get(item.id), ...item }))
      : defaultCatalog.items,
  });
}

export default async function handler(request, response) {
  if (request.method === "GET") {
    try {
      const catalog = await readCatalog();
      const authorized = isAuthorized(request);
      response.setHeader("Cache-Control", authorized ? "no-store" : "public, s-maxage=60, stale-while-revalidate=300");
      return response.status(200).json(authorized ? catalog : publicCatalog(catalog));
    } catch {
      response.setHeader("Cache-Control", "public, s-maxage=30");
      const catalog = normalizeCatalog(defaultCatalog);
      return response.status(200).json(publicCatalog(catalog));
    }
  }

  if (request.method !== "POST") {
    response.setHeader("Allow", "GET, POST");
    return response.status(405).json({ error: "Method not allowed" });
  }
  if (!isAuthorized(request)) return reject(response);

  const sourceItems = Array.isArray(request.body?.items) ? request.body.items : [];
  const items = sourceItems.slice(0, 100).map(normalizeItem).filter(Boolean);
  if (!items.length) return response.status(400).json({ error: "Add at least one catalogue item" });
  const catalog = {
    version: 3,
    updatedAt: new Date().toISOString(),
    settings: normalizeSettings(request.body?.settings),
    items,
  };

  try {
    await put(CATALOG_PATH, JSON.stringify(catalog), {
      access: "public",
      allowOverwrite: true,
      addRandomSuffix: false,
      contentType: "application/json; charset=utf-8",
      cacheControlMaxAge: 0,
    });
    response.setHeader("Cache-Control", "no-store");
    return response.status(200).json(catalog);
  } catch (error) {
    console.error("Catalogue save failed", error);
    return response.status(500).json({ error: "The catalogue could not be saved" });
  }
}
