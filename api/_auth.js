import crypto from "node:crypto";

const ITERATIONS = 210000;
const SESSION_SECONDS = 8 * 60 * 60;
const COOKIE_NAME = "hgp_admin_session";

function header(request, name) {
  const value = request.headers?.[name.toLowerCase()] ?? request.headers?.[name];
  return Array.isArray(value) ? value[0] : value;
}

function parseCookies(request) {
  return String(header(request, "cookie") || "").split(";").reduce((cookies, entry) => {
    const separator = entry.indexOf("=");
    if (separator < 0) return cookies;
    const key = entry.slice(0, separator).trim();
    const value = entry.slice(separator + 1).trim();
    if (key) cookies[key] = value;
    return cookies;
  }, {});
}

function secureEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function sign(payload) {
  const secret = process.env.HGP_ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) return "";
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

export function verifyCredentials(email, password) {
  const allowedEmail = process.env.HGP_ADMIN_EMAIL?.trim().toLowerCase();
  const passwordSalt = process.env.HGP_ADMIN_PASSWORD_SALT;
  const passwordHash = process.env.HGP_ADMIN_PASSWORD_HASH;
  if (!allowedEmail || !passwordSalt || !/^[a-f0-9]{64}$/i.test(passwordHash || "")) return false;
  if (typeof email !== "string" || typeof password !== "string") return false;
  if (!secureEqual(email.trim().toLowerCase(), allowedEmail)) return false;

  const candidateHash = crypto.pbkdf2Sync(password, passwordSalt, ITERATIONS, 32, "sha256").toString("hex");
  return secureEqual(candidateHash, passwordHash.toLowerCase());
}

export function createSession(email) {
  const normalizedEmail = email.trim().toLowerCase();
  const payload = Buffer.from(JSON.stringify({
    email: normalizedEmail,
    exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS,
  })).toString("base64url");
  const signature = sign(payload);
  if (!signature) return null;
  return {
    email: normalizedEmail,
    cookie: `${COOKIE_NAME}=${payload}.${signature}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_SECONDS}`,
  };
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export function sessionFromRequest(request) {
  const token = parseCookies(request)[COOKIE_NAME];
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !secureEqual(signature, sign(payload))) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    const allowedEmail = process.env.HGP_ADMIN_EMAIL?.trim().toLowerCase();
    if (!allowedEmail || session.email !== allowedEmail || session.exp <= Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch {
    return null;
  }
}

export function isAuthorized(request) {
  return Boolean(sessionFromRequest(request));
}

export function reject(response) {
  response.setHeader("Cache-Control", "no-store");
  return response.status(401).json({ error: "Access denied" });
}
