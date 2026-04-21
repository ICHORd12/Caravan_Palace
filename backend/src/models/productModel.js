const pool = require("../config/db");
const { mapProduct } = require("../utils/mappers");
const { getOrderByClause } = require("../utils/sorter");

exports.getAllProducts = async (sort) => {
  const result = await pool.query(
    `SELECT *
     FROM products
     ${getOrderByClause(sort)}`
  );

  return result.rows.map(mapProduct);
};

exports.getProductsByCategoryName = async (category_name, sort) => {
  const result = await pool.query(
    `SELECT p.*
     FROM products p
     INNER JOIN categories c ON p.category_id = c.category_id
     WHERE c.category_name = $1
     ${getOrderByClause(sort)}`,
    [category_name]
  );

  return result.rows.map(mapProduct);
};

exports.getProductById = async (productId) => {
  const result = await pool.query(
    `
    SELECT 
      product_id,
      name,
      current_price,
      quantity_in_stocks
    FROM products
    WHERE product_id = $1
    `,
    [productId]
  );

  return mapProduct(result.rows[0]);
};


exports.getProductsByIds = async (productIds, sort) => {
  const result = await pool.query(
    `
    SELECT *
    FROM products
    WHERE product_id = ANY($1::uuid[])
    ${getOrderByClause(sort)}
    `,
    [productIds]
  );

  return result.rows.map(mapProduct);
};


exports.getProductByIdForUpdate = async (productId, client) => {
  const executor = client || pool;

  const result = await executor.query(
    `
    SELECT
      product_id,
      name,
      current_price,
      quantity_in_stocks
    FROM products
    WHERE product_id = $1
    FOR UPDATE
    `,
    [productId]
  );

  return mapProduct(result.rows[0] || null);
};

exports.searchProductsByNameOrDescription = async (searchTerm, sort) => {
  const likePattern = "%" + searchTerm + "%";

  const result = await pool.query(
    `SELECT *
     FROM products
     WHERE name ILIKE $1 OR description ILIKE $1
     ${getOrderByClause(sort)}`,
    [likePattern]
  );

  return result.rows.map(mapProduct);
};


exports.decreaseStock = async ({ productId, quantity }, client) => {
  const executor = client || pool;

  const result = await executor.query(
    `
    UPDATE products
    SET quantity_in_stocks = quantity_in_stocks - $1
    WHERE product_id = $2
      AND quantity_in_stocks >= $1
    RETURNING product_id, quantity_in_stocks
    `,
    [quantity, productId]
  );

  if (result.rowCount === 0) {
    throw new Error("Failed to decrease stock");
  }

  return result.rows[0];
};

