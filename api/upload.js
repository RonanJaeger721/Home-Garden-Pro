import crypto from "node:crypto";
import { put } from "@vercel/blob";
import { isAuthorized, reject } from "./_auth.js";

const ACCEPTED_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);
const MAX_BYTES = 2.5 * 1024 * 1024;

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }

  if (!isAuthorized(request)) return reject(response);

  const { data, type, filename } = request.body || {};
  if (!ACCEPTED_TYPES.has(type) || typeof data !== "string") {
    return response.status(400).json({ error: "Choose a JPG, PNG or WebP image" });
  }

  const payload = data.includes(",") ? data.split(",").pop() : data;
  const buffer = Buffer.from(payload, "base64");
  if (!buffer.length || buffer.length > MAX_BYTES) {
    return response.status(400).json({ error: "The compressed image must be under 2.5 MB" });
  }

  const stem = String(filename || "catalogue-image")
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "catalogue-image";
  const extension = ACCEPTED_TYPES.get(type);
  const pathname = `catalog/images/${stem}-${crypto.randomBytes(5).toString("hex")}.${extension}`;

  try {
    const blob = await put(pathname, buffer, {
      access: "public",
      addRandomSuffix: false,
      contentType: type,
      cacheControlMaxAge: 31536000,
    });

    response.setHeader("Cache-Control", "no-store");
    return response.status(200).json({ url: blob.url });
  } catch (error) {
    console.error("Image upload failed", error);
    return response.status(500).json({ error: "The image could not be uploaded" });
  }
}
