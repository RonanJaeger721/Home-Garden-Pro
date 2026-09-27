import assert from "node:assert/strict";
import test from "node:test";
import authHandler from "../api/auth.js";
import catalogHandler from "../api/catalog.js";

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

test("catalogue GET returns the price-hidden source catalogue without storage", async () => {
  const previousToken = process.env.BLOB_READ_WRITE_TOKEN;
  delete process.env.BLOB_READ_WRITE_TOKEN;
  const response = responseMock();

  await catalogHandler({ method: "GET", headers: {} }, response);

  if (previousToken) process.env.BLOB_READ_WRITE_TOKEN = previousToken;
  assert.equal(response.statusCode, 200);
  assert.equal(response.payload.items.length, 6);
  assert.ok(response.payload.items.every((item) => item.showEstimate === false));
});

test("admin auth rejects a missing or incorrect key", () => {
  const response = responseMock();
  authHandler({ method: "POST", headers: { "x-admin-key": "not-the-key" } }, response);
  assert.equal(response.statusCode, 401);
  assert.equal(response.payload.error, "Access denied");
});

test("catalogue writes require admin authorization", async () => {
  const response = responseMock();
  await catalogHandler({ method: "POST", headers: {}, body: { items: [] } }, response);
  assert.equal(response.statusCode, 401);
});
