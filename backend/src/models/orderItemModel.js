const pool = require("../config/db");
const { mapOrderItem } = require("../utils/mappers");

exports.createOrderItem = async (
  { orderId, productId, quantity, purchasedPrice },
  client
) => {
  const executor = client || pool;

  const result = await executor.query(
    `
    INSERT INTO order_items (
      order_id,
      product_id,
      quantity,
      purchased_price
    )
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [orderId, productId, quantity, purchasedPrice]
  );

  return mapOrderItem(result.rows[0]);
};

exports.getOrderItemsByOrderId = async (orderId, client) => {
  const executor = client || pool;

  const result = await executor.query(
    `
    SELECT *
    FROM order_items
    WHERE order_id = $1
    ORDER BY order_item_id ASC
    `,
    [orderId]
  );

  return result.rows.map(mapOrderItem);
};

exports.getOrderItemById = async (orderItemId, client) => {
  const executor = client || pool;

  const result = await executor.query(
    `
    SELECT *
    FROM order_items
    WHERE order_item_id = $1
    `,
    [orderItemId]
  );

  return mapOrderItem(result.rows[0]);
};

exports.getOrderItemCountByOrderId = async (orderId, client) => {
  const executor = client || pool;

  const result = await executor.query(
    `
    SELECT COUNT(*)::int AS count
    FROM order_items
    WHERE order_id = $1
    `,
    [orderId]
  );

  return result.rows[0] ? result.rows[0].count : 0;
};

exports.markOrderItemsDeliveredByOrderId = async (orderId, client) => {
  const executor = client || pool;

  const result = await executor.query(
    `
    UPDATE order_items
    SET is_delivered = true
    WHERE order_id = $1
    `,
    [orderId]
  );

  return result.rowCount;
};
