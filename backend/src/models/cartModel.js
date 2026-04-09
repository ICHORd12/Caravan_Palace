const pool = require("../config/db");
const { mapCartItem } = require("../utils/map");

exports.getCartItemsByUserId = async (userId) => {
  const result = await pool.query(
    `
    SELECT 
      ci.cart_item_id,
      ci.product_id,
      ci.quantity,
      ci.added_at
    FROM cart_items ci
    WHERE ci.user_id = $1
    ORDER BY ci.added_at ASC
    `,
    [userId]
  );

  return result.rows.map(mapCartItem);
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


exports.clearCart = async (userId) => {
  const result = await pool.query(
    `
    DELETE FROM cart_items
    WHERE user_id = $1
    RETURNING *
    `,
    [userId]
  );

  return result.rows.map(mapCartItem);
};