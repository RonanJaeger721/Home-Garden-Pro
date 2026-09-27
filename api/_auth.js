import crypto from "node:crypto";

const PASSWORD_SALT = "087e47300383f9579bc4f6d91a48fb1b";
const PASSWORD_HASH = "68c069d16f1223c0f3f483ca072bc118025056fb1eb26877e096082eb269b9b7";
const ITERATIONS = 210000;

export function isAuthorized(request) {
  const candidate = request.headers["x-admin-key"];
  if (typeof candidate !== "string" || candidate.length < 20) return false;

  const candidateHash = crypto
    .pbkdf2Sync(candidate, PASSWORD_SALT, ITERATIONS, 32, "sha256")
    .toString("hex");

  return crypto.timingSafeEqual(
    Buffer.from(candidateHash, "hex"),
    Buffer.from(PASSWORD_HASH, "hex"),
  );
}

export function reject(response) {
  response.setHeader("Cache-Control", "no-store");
  return response.status(401).json({ error: "Access denied" });
}
