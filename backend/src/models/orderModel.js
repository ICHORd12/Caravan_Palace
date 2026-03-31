const pool = require("../config/db");

exports.createOrder = async (userId, totalAmount, shippingAddress) => {
  const result = await pool.query(
    `INSERT INTO orders (user_id, total_amount, shipping_address, status)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, totalAmount, shippingAddress, "processing"]
  );
  return result.rows[0];
};

exports.addOrderItem = async (orderId, productId, quantity, unitPrice) => {
  const result = await pool.query(
    `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [orderId, productId, quantity, unitPrice]
  );
  return result.rows[0];
};

exports.getOrdersByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
};

exports.getOrderById = async (orderId) => {
  const result = await pool.query(
    `SELECT * FROM orders WHERE order_id = $1`,
    [orderId]
  );
  return result.rows[0];
};

exports.getOrderItems = async (orderId) => {
  const result = await pool.query(
    `SELECT oi.*, p.name, p.image_url
     FROM order_items oi
     JOIN products p ON oi.product_id = p.product_id
     WHERE oi.order_id = $1`,
    [orderId]
  );
  return result.rows;
};

exports.updateOrderStatus = async (orderId, status, transactionId) => {
  const result = await pool.query(
    `UPDATE orders SET status = $1, transaction_id = $2, updated_at = NOW()
     WHERE order_id = $3 RETURNING *`,
    [status, transactionId, orderId]
  );
  return result.rows[0];
};
