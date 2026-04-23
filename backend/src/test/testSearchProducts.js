// Integration tests for GET /api/v2/products/search
//
// Run a backend server first (e.g. `npm run dev`), then:
//   node --test src/test/testSearchProducts.js
//
// Override the base URL with API_BASE_URL if your server is not on :3000.
// Override KNOWN_TERM with a substring guaranteed to match at least one
// product name/description in your test database.

const test = require("node:test");
const assert = require("node:assert/strict");

const BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";
const SEARCH_URL = `${BASE_URL}/api/v2/products/search`;
const KNOWN_TERM = process.env.SEARCH_KNOWN_TERM || "Caravan";

const buildUrl = (params) => {
  const url = new URL(SEARCH_URL);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
};

test("returns 200 and matching products when q matches a known term", async () => {
  const res = await fetch(buildUrl({ q: KNOWN_TERM }));
  assert.equal(res.status, 200);

  const body = await res.json();
  assert.equal(body.message, "Products fetched successfully");
  assert.ok(Array.isArray(body.products), "products should be an array");
  assert.ok(body.products.length > 0, "expected at least one product match");

  const needle = KNOWN_TERM.toLowerCase();
  for (const product of body.products) {
    const haystack = `${product.name ?? ""} ${product.description ?? ""}`.toLowerCase();
    assert.ok(
      haystack.includes(needle),
      `product ${product.productId} should contain "${KNOWN_TERM}" in name or description`
    );
  }
});

test("returns 200 and an empty array when q matches nothing", async () => {
  const res = await fetch(buildUrl({ q: "zzz_no_such_product_xyz_42" }));
  assert.equal(res.status, 200);

  const body = await res.json();
  assert.equal(body.message, "Products fetched successfully");
  assert.deepEqual(body.products, []);
});

test("returns 400 when q query parameter is missing", async () => {
  const res = await fetch(SEARCH_URL);
  assert.equal(res.status, 400);

  const body = await res.json();
  assert.match(body.message, /q/i);
});

test("returns 400 when q is only whitespace", async () => {
  const res = await fetch(buildUrl({ q: "   " }));
  assert.equal(res.status, 400);

  const body = await res.json();
  assert.match(body.message, /q/i);
});

test("returns results sorted by current price ascending when sort=price_asc", async () => {
  const res = await fetch(buildUrl({ q: KNOWN_TERM, sort: "price_asc" }));
  assert.equal(res.status, 200);

  const body = await res.json();
  assert.ok(Array.isArray(body.products));
  assert.ok(body.products.length >= 2, "need at least 2 matches to verify sort order");

  const prices = body.products.map((p) => Number(p.currentPrice));
  for (let i = 1; i < prices.length; i++) {
    assert.ok(
      prices[i - 1] <= prices[i],
      `expected ascending order, got ${prices[i - 1]} before ${prices[i]}`
    );
  }
});
