const pool = require("../config/db");
const { mapProduct } = require("../utils/mappers");
const { getOrderByClause } = require("../utils/sorter");
const { productImagesSelect, productRatingSelect, productRatingJoin } = require("../utils/sqlHelpers");

exports.getAllProducts = async (sort) => {
  const result = await pool.query(
    `
    SELECT 
      p.*,
      ${productImagesSelect},
      ${productRatingSelect}
    FROM products p
    LEFT JOIN product_images pi ON p.product_id = pi.product_id
    ${productRatingJoin}
    GROUP BY p.product_id, pr.average_rating, pr.review_count
    ${getOrderByClause(sort)}
    `
  );

  return result.rows.map(mapProduct);
};


exports.getProductsByCategoryName = async (category_name, sort) => {
  const result = await pool.query(
    `
    SELECT 
      p.*,
      ${productImagesSelect},
      ${productRatingSelect}
    FROM products p
    INNER JOIN categories c ON p.category_id = c.category_id
    LEFT JOIN product_images pi ON p.product_id = pi.product_id
    ${productRatingJoin}
    WHERE c.category_name = $1
    GROUP BY p.product_id, pr.average_rating, pr.review_count
    ${getOrderByClause(sort)}
    `,
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


exports.getProductDetailsById = async (productId) => {
  const result = await pool.query(
    `
    SELECT 
      p.*,
      ${productImagesSelect},
      ${productRatingSelect}
    FROM products p
    LEFT JOIN product_images pi ON p.product_id = pi.product_id
    ${productRatingJoin}
    WHERE p.product_id = $1
    GROUP BY p.product_id, pr.average_rating, pr.review_count
    `,
    [productId]
  );

  return mapProduct(result.rows[0]);
};


exports.getProductsByIds = async (productIds, sort) => {
  const result = await pool.query(
    `
    SELECT 
      p.*,
      ${productImagesSelect},
      ${productRatingSelect}
    FROM products p
    LEFT JOIN product_images pi ON p.product_id = pi.product_id
    ${productRatingJoin}
    WHERE p.product_id = ANY($1::uuid[])
    GROUP BY p.product_id, pr.average_rating, pr.review_count
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


exports.getProductDiscountForUpdate = async (productId, client) => {
  const executor = client || pool;

  const result = await executor.query(
    `
    SELECT
      product_id,
      name,
      model,
      base_price,
      current_price,
      discount_rate
    FROM products
    WHERE product_id = $1
    FOR UPDATE
    `,
    [productId]
  );

  return mapProduct(result.rows[0] || null);
};


exports.updateProductDiscount = async ({ productId, discountRate }, client) => {
  const executor = client || pool;

  const result = await executor.query(
    `
    UPDATE products
    SET discount_rate = $1,
        current_price = ROUND((base_price * (1 - ($1::numeric / 100)))::numeric, 2),
        updated_at = NOW()
    WHERE product_id = $2
    RETURNING *
    `,
    [discountRate, productId]
  );

  return mapProduct(result.rows[0] || null);
};

exports.updateProductBasePrice = async ({ productId, basePrice }, client) => {
  const executor = client || pool;

  const result = await executor.query(
    `
    UPDATE products
    SET base_price = $1,
        current_price = ROUND(($1 * (1 - (COALESCE(discount_rate, 0)::numeric / 100)))::numeric, 2),
        updated_at = NOW()
    WHERE product_id = $2
    RETURNING *
    `,
    [basePrice, productId]
  );

  return mapProduct(result.rows[0] || null);
};


exports.searchProductsByNameOrDescription = async (searchTerm, sort) => {
  const likePattern = "%" + searchTerm + "%";

  const result = await pool.query(
    `
    SELECT 
      p.*,
      ${productImagesSelect},
      ${productRatingSelect}
    FROM products p
    LEFT JOIN product_images pi ON p.product_id = pi.product_id
    ${productRatingJoin}
    WHERE p.name ILIKE $1 OR p.description ILIKE $1
    GROUP BY p.product_id, pr.average_rating, pr.review_count
    ${getOrderByClause(sort)}
    `,
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

exports.increaseStock = async ({ productId, quantity }, client) => {
  const executor = client || pool;

  const result = await executor.query(
    `
    UPDATE products
    SET quantity_in_stocks = quantity_in_stocks + $1
    WHERE product_id = $2
    RETURNING product_id, quantity_in_stocks
    `,
    [quantity, productId]
  );

  if (result.rowCount === 0) {
    throw new Error("Failed to increase stock");
  }

  return result.rows[0];
};
