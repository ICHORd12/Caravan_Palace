const pool = require("../config/db");

exports.getAllProducts = async (sortBy, order) => {
  let orderClause = "ORDER BY created_at DESC";
  if (sortBy === "price") {
    orderClause = `ORDER BY current_price ${order === "desc" ? "DESC" : "ASC"}`;
  } else if (sortBy === "popularity") {
    orderClause = "ORDER BY popularity DESC";
  }

  const result = await pool.query(
    `SELECT * FROM products ${orderClause}`
  );
  return result.rows;
};

exports.getProductById = async (id) => {
  const result = await pool.query(
    `SELECT * FROM products WHERE product_id = $1`,
    [id]
  );
  return result.rows[0];
};

exports.getProductsByCategoryId = async (category_id) => {
  const result = await pool.query(
    `SELECT * FROM products WHERE category_id = $1 ORDER BY created_at DESC`,
    [category_id]
  );
  return result.rows;
};

exports.searchProducts = async (searchTerm) => {
  const result = await pool.query(
    `SELECT * FROM products WHERE name ILIKE $1 OR description ILIKE $1 ORDER BY created_at DESC`,
    [`%${searchTerm}%`]
  );
  return result.rows;
};

exports.decrementStock = async (productId, quantity) => {
  const result = await pool.query(
    `UPDATE products SET quantity_in_stocks = quantity_in_stocks - $1, updated_at = NOW() WHERE product_id = $2 RETURNING *`,
    [quantity, productId]
  );
  return result.rows[0];
};

exports.getCategories = async () => {
  const result = await pool.query(`SELECT * FROM categories ORDER BY category_id ASC`);
  return result.rows;
};
