const pool = require("../config/db");
const { mapRefund } = require("../utils/mappers");

exports.createRefund = async ({ orderItemId, refundAmount }, client) => {
  const executor = client || pool;

  const result = await executor.query(
    `
    INSERT INTO refunds (
      order_item_id,
      refund_amount
    )
    VALUES ($1, $2)
    RETURNING *
    `,
    [orderItemId, refundAmount]
  );

  return mapRefund(result.rows[0]);
};

exports.getRefundById = async (refundId, client) => {
  const executor = client || pool;

  const result = await executor.query(
    `
    SELECT *
    FROM refunds
    WHERE refund_id = $1
    `,
    [refundId]
  );

  return mapRefund(result.rows[0]);
};

exports.getRefundsByOrderId = async (orderId, client) => {
  const executor = client || pool;

  const result = await executor.query(
    `
    SELECT r.*, oi.order_id
    FROM refunds r
    INNER JOIN order_items oi ON r.order_item_id = oi.order_item_id
    WHERE oi.order_id = $1
    ORDER BY r.request_date ASC
    `,
    [orderId]
  );

  return result.rows.map(mapRefund);
};

exports.getRefundWithOrder = async (refundId, client) => {
  const executor = client || pool;

  const result = await executor.query(
    `
    SELECT r.*, oi.order_id, o.customer_id
    FROM refunds r
    INNER JOIN order_items oi ON r.order_item_id = oi.order_item_id
    INNER JOIN orders o ON oi.order_id = o.order_id
    WHERE r.refund_id = $1
    `,
    [refundId]
  );

  return mapRefund(result.rows[0]);
};

exports.listRefunds = async ({ status }, client) => {
  const executor = client || pool;
  const values = [];
  let whereClause = "";

  if (status) {
    values.push(status);
    whereClause = "WHERE r.status = $1";
  }

  const result = await executor.query(
    `
    SELECT r.*, oi.order_id, o.customer_id
    FROM refunds r
    INNER JOIN order_items oi ON r.order_item_id = oi.order_item_id
    INNER JOIN orders o ON oi.order_id = o.order_id
    ${whereClause}
    ORDER BY r.request_date DESC
    `,
    values
  );

  return result.rows.map(mapRefund);
};

exports.updateRefundStatus = async ({ refundId, status }, client) => {
  const executor = client || pool;

  const result = await executor.query(
    `
    UPDATE refunds
    SET status = $1,
        processed_at = NOW()
    WHERE refund_id = $2
    RETURNING *
    `,
    [status, refundId]
  );

  return mapRefund(result.rows[0]);
};

exports.getRefundCountsByOrderId = async (orderId, client) => {
  const executor = client || pool;

  const result = await executor.query(
    `
    SELECT
      COUNT(*)::int AS total,
      COALESCE(SUM(CASE WHEN r.status = 'approved' THEN 1 ELSE 0 END), 0)::int AS approved
    FROM refunds r
    INNER JOIN order_items oi ON r.order_item_id = oi.order_item_id
    WHERE oi.order_id = $1
    `,
    [orderId]
  );

  return result.rows[0] || { total: 0, approved: 0 };
};
