const pool = require("../config/db");

exports.getAllProducts = async () => {
  const result = await pool.query(`
    SELECT *
    FROM products
    ORDER BY created_at DESC
  `);

  return result.rows;
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
