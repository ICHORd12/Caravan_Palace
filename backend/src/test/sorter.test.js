const { describe, test, expect } = require("@jest/globals");
const { normalizeSort, getOrderByClause } = require("../utils/sorter");

describe("sorter utilities", () => {
  test("normalizeSort accepts every supported sort option", () => {
    const supportedSorts = [
      "price_asc",
      "price_desc",
      "date_asc",
      "date_desc",
      "rating_asc",
      "rating_desc",
    ];

    for (const sort of supportedSorts) {
      expect(normalizeSort(sort)).toBe(sort);
    }
  });

  test("normalizeSort rejects unsupported values with a client error", () => {
    expect(() => normalizeSort("name_asc")).toThrow(
      /Invalid sort parameter/
    );

    try {
      normalizeSort("name_asc");
    } catch (error) {
      expect(error.statusCode).toBe(400);
    }
  });

  test("getOrderByClause falls back to newest products first", () => {
    expect(getOrderByClause(undefined)).toBe("ORDER BY created_at DESC");
  });
});
