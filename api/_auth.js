import crypto from "node:crypto";

const ITERATIONS = 210000;

export function isAuthorized(request) {
  const candidate = request.headers["x-admin-key"];
  if (typeof candidate !== "string" || candidate.length < 20) return false;

  const passwordSalt = process.env.HGP_ADMIN_PASSWORD_SALT;
  const passwordHash = process.env.HGP_ADMIN_PASSWORD_HASH;
  if (!passwordSalt || !/^[a-f0-9]{64}$/i.test(passwordHash || "")) return false;

  const candidateHash = crypto
    .pbkdf2Sync(candidate, passwordSalt, ITERATIONS, 32, "sha256")
    .toString("hex");

  return crypto.timingSafeEqual(
    Buffer.from(candidateHash, "hex"),
    Buffer.from(passwordHash, "hex"),
  );
}

export function reject(response) {
  response.setHeader("Cache-Control", "no-store");
  return response.status(401).json({ error: "Access denied" });
}
