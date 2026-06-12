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
        { product_id: 1, category_id: 'cat-1', category_name: 'Camper Vans', name: 'A', current_price: '10.00', quantity_in_stocks: 3, is_active: true },
        { product_id: 2, category_id: null, category_name: null, name: 'B', current_price: '20.00', quantity_in_stocks: 0, is_active: false },
      ],
      rowCount: 2,
    });

    const products = await productModel.getAllProducts('price_asc');

    expect(querySpy).toHaveBeenCalledTimes(1);
    const sql = querySpy.mock.calls[0][0];
    expect(sql).toMatch(/FROM products/i);
    expect(sql).toMatch(/LEFT JOIN categories c ON p\.category_id = c\.category_id/i);
    expect(sql).toMatch(/c\.category_name/i);
    expect(sql).toMatch(/is_active = TRUE/i);
    expect(sql).toMatch(/GROUP BY p\.product_id, c\.category_name/i);
    expect(sql).toMatch(/ORDER BY current_price ASC/);

    expect(products).toHaveLength(2);
    expect(products[0]).toMatchObject({
      productId: 1,
      categoryId: 'cat-1',
      categoryName: 'Camper Vans',
      name: 'A',
      isActive: true,
    });
    expect(products[1]).toMatchObject({
      productId: 2,
      categoryId: null,
      categoryName: null,
      name: 'B',
      isActive: false,
    });
  });

  test('getProductDetailsById returns categoryName with product details', async () => {
    querySpy.mockResolvedValue({
      rows: [
        {
          product_id: 11,
          category_id: 'cat-2',
          category_name: 'Off-Road Caravans',
          name: 'Trail Master',
          current_price: '125000.00',
          quantity_in_stocks: 4,
          is_active: true,
        },
      ],
      rowCount: 1,
    });

    const product = await productModel.getProductDetailsById(11);

    expect(querySpy).toHaveBeenCalledTimes(1);
    const [sql, params] = querySpy.mock.calls[0];
    expect(sql).toMatch(/LEFT JOIN categories c ON p\.category_id = c\.category_id/i);
    expect(sql).toMatch(/WHERE p\.product_id = \$1/i);
    expect(sql).toMatch(/AND p\.is_active = TRUE/i);
    expect(sql).toMatch(/GROUP BY p\.product_id, c\.category_name/i);
    expect(params).toEqual([11]);

    expect(product).toMatchObject({
      productId: 11,
      categoryId: 'cat-2',
      categoryName: 'Off-Road Caravans',
      name: 'Trail Master',
    });
  });

  test('getProductsByCategoryName keeps filtered product payloads category-aware', async () => {
    querySpy.mockResolvedValue({
      rows: [
        {
          product_id: 12,
          category_id: 'cat-3',
          category_name: 'Luxury Caravans',
          name: 'Grand Tourer',
          current_price: '250000.00',
          quantity_in_stocks: 1,
          is_active: true,
        },
      ],
      rowCount: 1,
    });

    const products = await productModel.getProductsByCategoryName('Luxury Caravans', 'date_desc');

    expect(querySpy).toHaveBeenCalledTimes(1);
    const [sql, params] = querySpy.mock.calls[0];
    expect(sql).toMatch(/INNER JOIN categories c ON p\.category_id = c\.category_id/i);
    expect(sql).toMatch(/c\.category_name = \$1/i);
    expect(sql).toMatch(/AND c\.is_active = TRUE/i);
    expect(sql).toMatch(/GROUP BY p\.product_id, c\.category_name/i);
    expect(params).toEqual(['Luxury Caravans']);

    expect(products[0]).toMatchObject({
      productId: 12,
      categoryId: 'cat-3',
      categoryName: 'Luxury Caravans',
      name: 'Grand Tourer',
    });
  });

  test('getAllProducts supports date and rating sorts', async () => {
    querySpy.mockResolvedValue({ rows: [], rowCount: 0 });

    await productModel.getAllProducts('date_desc');
    expect(querySpy.mock.calls[0][0]).toMatch(/ORDER BY created_at DESC/i);

    querySpy.mockResolvedValue({ rows: [], rowCount: 0 });
    await productModel.getAllProducts('rating_desc');
    expect(querySpy.mock.calls[1][0]).toMatch(/ORDER BY pr\.average_rating DESC/i);
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
