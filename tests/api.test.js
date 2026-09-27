import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";
import authHandler from "../api/auth.js";
import catalogHandler from "../api/catalog.js";

const TEST_EMAIL = "admin@example.test";
const TEST_PASSWORD = "local-test-password";
const TEST_SALT = "0123456789abcdef0123456789abcdef";

process.env.HGP_ADMIN_EMAIL = TEST_EMAIL;
process.env.HGP_ADMIN_PASSWORD_SALT = TEST_SALT;
process.env.HGP_ADMIN_PASSWORD_HASH = crypto.pbkdf2Sync(TEST_PASSWORD, TEST_SALT, 210000, 32, "sha256").toString("hex");
process.env.HGP_ADMIN_SESSION_SECRET = "test-session-secret-with-at-least-32-characters";

function responseMock() {
  return {
    headers: {},
    statusCode: 200,
    payload: null,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; },
  };
}

function loginCookie() {
  const response = responseMock();
  authHandler({ method: "POST", headers: {}, body: { email: TEST_EMAIL, password: TEST_PASSWORD } }, response);
  assert.equal(response.statusCode, 200);
  return response.headers["Set-Cookie"].split(";")[0];
}

test("catalogue GET returns normalized price-hidden data without storage", async () => {
  const previousToken = process.env.BLOB_READ_WRITE_TOKEN;
  delete process.env.BLOB_READ_WRITE_TOKEN;
  const response = responseMock();

  await catalogHandler({ method: "GET", headers: {} }, response);

  if (previousToken) process.env.BLOB_READ_WRITE_TOKEN = previousToken;
  assert.equal(response.statusCode, 200);
  assert.equal(response.payload.version, 3);
  assert.equal(response.payload.settings.whatsappCatalogUrl, "https://wa.me/c/30404207759615");
  assert.equal(response.payload.items.length, 6);
  assert.ok(response.payload.items.every((item) => item.showPrice === false));
  assert.ok(response.payload.items.every((item) => item.priceFrom === null && item.priceTo === null));
});

test("admin auth rejects incorrect credentials without setting a session", () => {
  const response = responseMock();
  authHandler({ method: "POST", headers: {}, body: { email: TEST_EMAIL, password: "incorrect" } }, response);
  assert.equal(response.statusCode, 401);
  assert.equal(response.payload.error, "Email or password incorrect.");
  assert.equal(response.headers["Set-Cookie"], undefined);
});

test("admin auth issues and validates a secure HttpOnly session cookie", () => {
  const loginResponse = responseMock();
  authHandler({ method: "POST", headers: {}, body: { email: TEST_EMAIL, password: TEST_PASSWORD } }, loginResponse);
  assert.equal(loginResponse.statusCode, 200);
  assert.match(loginResponse.headers["Set-Cookie"], /HttpOnly/);
  assert.match(loginResponse.headers["Set-Cookie"], /Secure/);
  assert.match(loginResponse.headers["Set-Cookie"], /SameSite=Strict/);

  const sessionResponse = responseMock();
  authHandler({ method: "GET", headers: { cookie: loginResponse.headers["Set-Cookie"].split(";")[0] } }, sessionResponse);
  assert.equal(sessionResponse.statusCode, 200);
  assert.equal(sessionResponse.payload.email, TEST_EMAIL);
});

test("catalogue writes reject requests without an authenticated session", async () => {
  const response = responseMock();
  await catalogHandler({ method: "POST", headers: {}, body: { items: [] } }, response);
  assert.equal(response.statusCode, 401);
  assert.equal(response.payload.error, "Access denied");
});

test("logout clears the signed session", () => {
  const cookie = loginCookie();
  const sessionResponse = responseMock();
  authHandler({ method: "GET", headers: { cookie } }, sessionResponse);
  assert.equal(sessionResponse.statusCode, 200);

  const logoutResponse = responseMock();
  authHandler({ method: "DELETE", headers: { cookie } }, logoutResponse);
  assert.equal(logoutResponse.statusCode, 200);
  assert.match(logoutResponse.headers["Set-Cookie"], /Max-Age=0/);
});
