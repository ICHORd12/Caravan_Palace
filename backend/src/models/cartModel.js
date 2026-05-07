const pool = require("../config/db");
const { mapCartItem, mapCartItemWithProduct } = require("../utils/mappers");

exports.getCartItemsByUserId = async (userId, client) => {
  const executor = client || pool;

  const result = await executor.query(
    `
    SELECT
      ci.cart_item_id,
      ci.user_id,
      ci.product_id,
      ci.quantity,
      ci.added_at,
      p.name AS product_name,
      p.current_price,
      p.quantity_in_stocks
    FROM cart_items ci
    INNER JOIN products p
      ON ci.product_id = p.product_id
    WHERE ci.user_id = $1
    ORDER BY ci.added_at ASC
    `,
    [userId]
  );

  return result.rows.map(mapCartItemWithProduct);
};

exports.getCartItemWithProductByUserIdAndProductId = async (userId, productId) => {
  const result = await pool.query(
    `
    SELECT
      ci.cart_item_id,
      ci.user_id,
      ci.product_id,
      ci.quantity,
      ci.added_at,
      p.name AS product_name,
      p.current_price,
      p.quantity_in_stocks
    FROM cart_items ci
    INNER JOIN products p
      ON ci.product_id = p.product_id
    WHERE ci.user_id = $1 AND ci.product_id = $2
    `,
    [userId, productId]
  );

  return mapCartItemWithProduct(result.rows[0]);
};

exports.getCartItemByUserIdAndProductId = async (userId, productId) => {
  const result = await pool.query(
    `
    SELECT *
    FROM cart_items
    WHERE user_id = $1 AND product_id = $2
    `,
    [userId, productId]
  );

  return mapCartItem(result.rows[0]);
};


exports.createCartItem = async ({ userId, productId, quantity }) => {
  const result = await pool.query(
    `
    INSERT INTO cart_items (user_id, product_id, quantity)
    VALUES ($1, $2, $3)
    RETURNING *
    `,
    [userId, productId, quantity]
  );

  return mapCartItem(result.rows[0]);
};


exports.updateCartItemQuantity = async (userId, productId, quantity) => {
  const result = await pool.query(
    `
    UPDATE cart_items
    SET quantity = $3
    WHERE user_id = $1 AND product_id = $2
    RETURNING *
    `,
    [userId, productId, quantity]
  );

  return mapCartItem(result.rows[0]);
};


exports.deleteCartItem = async (userId, productId) => {
  const result = await pool.query(
    `
    DELETE FROM cart_items
    WHERE user_id = $1 AND product_id = $2
    RETURNING *
    `,
    [userId, productId]
  );

  return mapCartItem(result.rows[0]);
};


exports.clearCartByUserId = async (userId, client) => {
  const executor = client || pool;
  const result = await executor.query(
    `
    DELETE FROM cart_items
    WHERE user_id = $1
    RETURNING *
    `,
    [userId]
  );

  return result.rows.map(mapCartItem);
};