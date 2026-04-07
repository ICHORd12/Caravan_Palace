const pool = require("../config/db");

const getOrderByClause = (sort) => {
  switch (sort) {
    case "price_asc":
      return "ORDER BY current_price ASC NULLS LAST";
    case "price_desc":
      return "ORDER BY current_price DESC NULLS LAST";
    default:
      return "ORDER BY created_at DESC";
  }
};


exports.getAllProducts = async (sort) => {
  const result = await pool.query(
    `SELECT *
     FROM products
     ${getOrderByClause(sort)}`
  );

  return result.rows;
};

exports.getProductsByCategoryId = async (category_id, sort) => {
  const result = await pool.query(
    `SELECT *
     FROM products
     WHERE category_id = $1
     ${getOrderByClause(sort)}`,
    [category_id]
  );

  return result.rows;
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
