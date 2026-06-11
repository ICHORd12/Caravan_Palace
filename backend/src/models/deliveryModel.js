const pool = require("../config/db");
const { mapDelivery } = require("../utils/mappers");

exports.getLatestCompletedDeliveryDateByOrderId = async (orderId, client) => {
  const executor = client || pool;

  const result = await executor.query(
    `
    SELECT MAX(updated_at) AS delivered_at
    FROM deliveries
    WHERE order_id = $1
      AND is_completed = true
    `,
    [orderId]
  );

  return result.rows[0] ? result.rows[0].delivered_at : null;
};

exports.getDeliveryCountByOrderId = async (orderId, client) => {
  const executor = client || pool;

  const result = await executor.query(
    `
    SELECT COUNT(*)::int AS count
    FROM deliveries
    WHERE order_id = $1
    `,
    [orderId]
  );

  return result.rows[0] ? result.rows[0].count : 0;
};

exports.listDeliveriesForManager = async (client) => {
  const executor = client || pool;

  const result = await executor.query(
    `
    SELECT
      delivery_id,
      order_id,
      customer_id,
      product_id,
      quantity,
      total_price,
      address,
      CASE
        WHEN is_completed = true THEN 'delivered'
        ELSE 'in-transit'
      END AS status
    FROM deliveries
    ORDER BY updated_at DESC, delivery_id ASC
    `
  );

  return result.rows.map(mapDelivery);
};

exports.createDeliveriesForOrder = async (orderId, client) => {
  const executor = client || pool;

  const result = await executor.query(
    `
    INSERT INTO deliveries (
      order_id,
      customer_id,
      product_id,
      quantity,
      total_price,
      address
    )
    SELECT
      oi.order_id,
      o.customer_id,
      oi.product_id,
      oi.quantity,
      (oi.quantity * oi.purchased_price) AS total_price,
      o.delivery_address
    FROM order_items oi
    INNER JOIN orders o ON o.order_id = oi.order_id
    WHERE oi.order_id = $1
    RETURNING delivery_id
    `,
    [orderId]
  );

  return result.rowCount;
};

exports.markDeliveriesCompletedByOrderId = async (orderId, client) => {
  const executor = client || pool;

  const result = await executor.query(
    `
    UPDATE deliveries
    SET is_completed = true,
        updated_at = CURRENT_TIMESTAMP
    WHERE order_id = $1
    `,
    [orderId]
  );

  return result.rowCount;
};
