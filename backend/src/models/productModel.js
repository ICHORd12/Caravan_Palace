const pool = require("../config/db");

exports.getAllProducts = async () => {
  const result = await pool.query(
    `SELECT *
     FROM products
     ORDER BY created_at DESC`
    );

  return result.rows;
};

exports.getProductsByCategoryName = async (category_name) => {
  const result = await pool.query(
    `SELECT p.*
     FROM products p
     INNER JOIN categories c ON p.category_id = c.category_id
     WHERE c.category_name = $1
     ORDER BY p.created_at DESC`,
    [category_name]
  );

  return result.rows;
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

  return result.rows[0] || null;
};

// exports.getAllProducts = async () => {
//   const result = await pool.query(`
//     SELECT
//       product_id,
//       category_id,
//       name,
//       model,
//       serial_number,
//       description,
//       quantity_in_stocks,
//       base_price,
//       current_price,
//       warranty_status,
//       distributor_info,
//       berth_count,
//       fuel_type,
//       weight_kg,
//       has_kitchen,
//       discount_rate,
//       created_at,
//       updated_at
//     FROM products
//     ORDER BY created_at DESC
//   `);

//   return result.rows;
// };
