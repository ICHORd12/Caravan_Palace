/**
 * Unit tests for categoryModel.js.
 */

const { describe, test, expect, beforeEach, afterEach } = require("@jest/globals");
const pool = require("../config/db");
const categoryModel = require("../models/categoryModel");

describe("categoryModel", () => {
  let querySpy;

  beforeEach(() => {
    querySpy = jest.spyOn(pool, "query");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ------------------------------------------------------------------
  // Test 1: getAllCategories filters inactive by default
  // ------------------------------------------------------------------
  test("getAllCategories applies is_active filter when includeInactive is false", async () => {
    querySpy.mockResolvedValue({
      rows: [
        {
          category_id: "cat-1",
          category_name: "Camping",
        },
      ],
      rowCount: 1,
    });

    const categories = await categoryModel.getAllCategories({ includeInactive: false });

    expect(querySpy).toHaveBeenCalledTimes(1);
    const [sql, params] = querySpy.mock.calls[0];
    expect(sql).toMatch(/FROM categories/i);
    expect(sql).toMatch(/WHERE is_active = \$1/i);
    expect(params).toEqual([true]);

    expect(categories).toEqual([
      {
        categoryId: "cat-1",
        categoryName: "Camping",
      },
    ]);
  });

  // ------------------------------------------------------------------
  // Test 2: getAllCategories can include inactive
  // ------------------------------------------------------------------
  test("getAllCategories omits filter when includeInactive is true", async () => {
    querySpy.mockResolvedValue({ rows: [], rowCount: 0 });

    await categoryModel.getAllCategories({ includeInactive: true });

    expect(querySpy).toHaveBeenCalledTimes(1);
    const [sql, params] = querySpy.mock.calls[0];
    expect(sql).toMatch(/FROM categories/i);
    expect(sql).not.toMatch(/WHERE is_active/i);
    expect(params).toEqual([]);
  });

  // ------------------------------------------------------------------
  // Test 3: updateCategoryIsActive updates is_active
  // ------------------------------------------------------------------
  test("updateCategoryIsActive updates the is_active flag", async () => {
    querySpy.mockResolvedValue({
      rows: [
        {
          category_id: "cat-2",
          category_name: "Luxury",
          is_active: false,
        },
      ],
      rowCount: 1,
    });

    const category = await categoryModel.updateCategoryIsActive({
      categoryId: "cat-2",
      isActive: false,
    });

    expect(querySpy).toHaveBeenCalledTimes(1);
    const [sql, params] = querySpy.mock.calls[0];
    expect(sql).toMatch(/UPDATE categories/i);
    expect(sql).toMatch(/SET is_active = \$1/i);
    expect(params).toEqual([false, "cat-2"]);

    expect(category).toEqual({
      categoryId: "cat-2",
      categoryName: "Luxury",
      isActive: false,
    });
  });
});
