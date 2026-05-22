/**
 * Unit tests for productModel.js.
 *
 * These tests MOCK pool.query (the pg Pool) so no real database is touched.
 * They verify that each model function:
 *   - issues the right SQL / parameters, and
 *   - correctly maps / handles the rows returned by the DB.
 */

const { describe, test, expect, beforeEach, afterEach } = require('@jest/globals');
const pool = require('../config/db');
const productModel = require('../models/productModel');

describe('productModel', () => {
  let querySpy;

  beforeEach(() => {
    querySpy = jest.spyOn(pool, 'query');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ------------------------------------------------------------------
  // Test 1: getProductById returns a mapped product when a row exists
  // ------------------------------------------------------------------
  test('getProductById returns a mapped product when a row is found', async () => {
    querySpy.mockResolvedValue({
      rows: [
        {
          product_id: 5,
          name: 'Vintage Lamp',
          current_price: '49.99',
          quantity_in_stocks: 10,
          is_active: true,
        },
      ],
      rowCount: 1,
    });

    const product = await productModel.getProductById(5);

    // Called pool.query exactly once, with the productId param
    expect(querySpy).toHaveBeenCalledTimes(1);
    const [sql, params] = querySpy.mock.calls[0];
    expect(sql).toMatch(/FROM products/i);
    expect(sql).toMatch(/WHERE product_id = \$1/);
    expect(params).toEqual([5]);

    // Result is mapped (snake_case -> camelCase)
    expect(product).toMatchObject({
      productId: 5,
      name: 'Vintage Lamp',
      currentPrice: '49.99',
      quantityInStocks: 10,
      isActive: true,
    });
  });

  // ------------------------------------------------------------------
  // Test 2: getProductById returns null when no rows are returned
  // ------------------------------------------------------------------
  test('getProductById returns null when no rows are returned', async () => {
    querySpy.mockResolvedValue({ rows: [], rowCount: 0 });

    const product = await productModel.getProductById(999);

    expect(product).toBeNull();
    expect(querySpy).toHaveBeenCalledWith(expect.any(String), [999]);
  });

  // ------------------------------------------------------------------
  // Test 2b: getActiveProductById filters by is_active
  // ------------------------------------------------------------------
  test('getActiveProductById applies the is_active filter', async () => {
    querySpy.mockResolvedValue({
      rows: [
        {
          product_id: 7,
          name: 'Active Product',
          current_price: '19.99',
          quantity_in_stocks: 2,
          is_active: true,
        },
      ],
      rowCount: 1,
    });

    const product = await productModel.getActiveProductById(7);

    expect(querySpy).toHaveBeenCalledTimes(1);
    const [sql, params] = querySpy.mock.calls[0];
    expect(sql).toMatch(/FROM products/i);
    expect(sql).toMatch(/WHERE product_id = \$1/i);
    expect(sql).toMatch(/is_active = TRUE/i);
    expect(params).toEqual([7]);

    expect(product).toMatchObject({
      productId: 7,
      name: 'Active Product',
      currentPrice: '19.99',
      quantityInStocks: 2,
      isActive: true,
    });
  });

  // ------------------------------------------------------------------
  // Test 3: getAllProducts maps multiple rows and respects the sort param
  // ------------------------------------------------------------------
  test('getAllProducts maps every row and applies the sort ORDER BY', async () => {
    querySpy.mockResolvedValue({
      rows: [
        { product_id: 1, name: 'A', current_price: '10.00', quantity_in_stocks: 3, is_active: true },
        { product_id: 2, name: 'B', current_price: '20.00', quantity_in_stocks: 0, is_active: false },
      ],
      rowCount: 2,
    });

    const products = await productModel.getAllProducts('price_asc');

    expect(querySpy).toHaveBeenCalledTimes(1);
    const sql = querySpy.mock.calls[0][0];
    expect(sql).toMatch(/FROM products/i);
    expect(sql).toMatch(/is_active = TRUE/i);
    expect(sql).toMatch(/ORDER BY current_price ASC/);

    expect(products).toHaveLength(2);
    expect(products[0]).toMatchObject({ productId: 1, name: 'A', isActive: true });
    expect(products[1]).toMatchObject({ productId: 2, name: 'B', isActive: false });
  });

  // ------------------------------------------------------------------
  // Test 4: searchProductsByNameOrDescription wraps the term with %...%
  // ------------------------------------------------------------------
  test('searchProductsByNameOrDescription wraps the search term in a LIKE pattern', async () => {
    querySpy.mockResolvedValue({ rows: [], rowCount: 0 });

    await productModel.searchProductsByNameOrDescription('lamp');

    expect(querySpy).toHaveBeenCalledTimes(1);
    const [sql, params] = querySpy.mock.calls[0];
    expect(sql).toMatch(/ILIKE/i);
    expect(sql).toMatch(/is_active = TRUE/i);
    // Implementation does "%" + searchTerm + "%"
    expect(params).toEqual(['%lamp%']);
  });

  // ------------------------------------------------------------------
  // Test 5: decreaseStock throws when the UPDATE affects 0 rows
  // ------------------------------------------------------------------
  test('decreaseStock throws when rowCount is 0 (not enough stock / missing product)', async () => {
    // First: insufficient-stock case -> rowCount 0 -> should throw
    querySpy.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    await expect(
      productModel.decreaseStock({ productId: 5, quantity: 10 })
    ).rejects.toThrow(/Failed to decrease stock/);

    // Second: successful case -> rowCount 1 -> returns updated row
    querySpy.mockResolvedValueOnce({
      rows: [{ product_id: 5, quantity_in_stocks: 2 }],
      rowCount: 1,
    });
    const result = await productModel.decreaseStock({
      productId: 5,
      quantity: 3,
    });
    expect(result).toEqual({ product_id: 5, quantity_in_stocks: 2 });

    // Both calls hit pool.query with (quantity, productId) order
    const secondCallParams = querySpy.mock.calls[1][1];
    expect(secondCallParams).toEqual([3, 5]);
  });

  // ------------------------------------------------------------------
  // Test 6: updateProductBasePrice updates base and current prices
  // ------------------------------------------------------------------
  test('updateProductBasePrice updates base_price and recalculates current_price', async () => {
    querySpy.mockResolvedValue({
      rows: [
        {
          product_id: 9,
          name: 'Road Trekker',
          base_price: '2500.50',
          current_price: '2250.45',
          discount_rate: 10,
        },
      ],
      rowCount: 1,
    });

    const product = await productModel.updateProductBasePrice({
      productId: 9,
      basePrice: 2500.5,
    });

    expect(querySpy).toHaveBeenCalledTimes(1);
    const [sql, params] = querySpy.mock.calls[0];
    expect(sql).toMatch(/UPDATE products/i);
    expect(sql).toMatch(/SET base_price = \$1/i);
    expect(sql).toMatch(/current_price/i);
    expect(params).toEqual([2500.5, 9]);

    expect(product).toMatchObject({
      productId: 9,
      name: 'Road Trekker',
      basePrice: '2500.50',
      currentPrice: '2250.45',
      discountRate: 10,
    });
  });

  // ------------------------------------------------------------------
  // Test 7: updateProductIsActive updates is_active
  // ------------------------------------------------------------------
  test('updateProductIsActive updates the is_active flag', async () => {
    querySpy.mockResolvedValue({
      rows: [{ product_id: 4, is_active: false }],
      rowCount: 1,
    });

    const product = await productModel.updateProductIsActive({
      productId: 4,
      isActive: false,
    });

    expect(querySpy).toHaveBeenCalledTimes(1);
    const [sql, params] = querySpy.mock.calls[0];
    expect(sql).toMatch(/UPDATE products/i);
    expect(sql).toMatch(/SET is_active = \$1/i);
    expect(sql).toMatch(/updated_at/i);
    expect(params).toEqual([false, 4]);

    expect(product).toEqual({ productId: 4, isActive: false });
  });

  // ------------------------------------------------------------------
  // Test 8: updateProductStock sets quantity_in_stocks
  // ------------------------------------------------------------------
  test('updateProductStock updates quantity_in_stocks and updated_at', async () => {
    querySpy.mockResolvedValue({
      rows: [
        {
          product_id: 3,
          quantity_in_stocks: 12,
        },
      ],
      rowCount: 1,
    });

    const product = await productModel.updateProductStock({
      productId: 3,
      quantityInStocks: 12,
    });

    expect(querySpy).toHaveBeenCalledTimes(1);
    const [sql, params] = querySpy.mock.calls[0];
    expect(sql).toMatch(/UPDATE products/i);
    expect(sql).toMatch(/SET quantity_in_stocks = \$1/i);
    expect(sql).toMatch(/updated_at/i);
    expect(sql).toMatch(/WHERE product_id = \$2/i);
    expect(params).toEqual([12, 3]);

    expect(product).toMatchObject({
      productId: 3,
      quantityInStocks: 12,
    });
  });
});
