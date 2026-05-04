const pool = require("../config/db");

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
