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
  return Number.isFinite(amount) && amount >= 0 ? Math.round(amount) : null;
}

function normalizeItem(item, index) {
  const name = normalizeText(item?.name, 80);
  if (!name) return null;

  const fallbackId = `item-${Date.now()}-${index}`;
  const id = normalizeText(item?.id, 96)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "") || fallbackId;

  return {
    id,
    name,
    category: normalizeText(item?.category, 80) || "Garden piece",
    image: normalizeText(item?.image, 500),
    alt: normalizeText(item?.alt, 140) || name,
    visible: item?.visible !== false,
    featured: item?.featured === true,
    estimateMin: normalizeAmount(item?.estimateMin),
    estimateMax: normalizeAmount(item?.estimateMax),
    showEstimate: item?.showEstimate === true,
  };
}

async function readCatalog() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return defaultCatalog;

  const { blobs } = await list({ prefix: CATALOG_PATH, limit: 1 });
  const current = blobs.find((blob) => blob.pathname === CATALOG_PATH);
  if (!current) return defaultCatalog;

  const result = await fetch(current.url, { cache: "no-store" });
  if (!result.ok) throw new Error("Unable to read catalogue");
  return result.json();
}

export default async function handler(request, response) {
  if (request.method === "GET") {
    try {
      const catalog = await readCatalog();
      response.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
      return response.status(200).json(catalog);
    } catch {
      response.setHeader("Cache-Control", "public, s-maxage=30");
      return response.status(200).json(defaultCatalog);
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
    version: 1,
    updatedAt: new Date().toISOString(),
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
