const pool = require("../config/db");
const { mapOrder, mapUser } = require("../utils/mappers");

exports.createOrder = async (
  { customerId, cardLast4, totalPrice, deliveryAddress },
  client
) => {
  const executor = client || pool;

  const result = await executor.query(
    `
    INSERT INTO orders (
      customer_id,
      card_last4,
      total_price,
      delivery_address
    )
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [customerId, cardLast4, totalPrice, deliveryAddress]
  );

  return mapOrder(result.rows[0]);
};

exports.getOrdersByCustomerId = async (customerId, client) => {
  const executor = client || pool;

  const result = await executor.query(
    `
    SELECT *
    FROM orders
    WHERE customer_id = $1
    ORDER BY order_date DESC
    `,
    [customerId]
  );

  return result.rows.map(mapOrder);
};

exports.getOrderByCustomerIdAndOrderId = async (customerId, orderId, client) => {
  const executor = client || pool;

  const result = await executor.query(
    `
    SELECT *
    FROM orders
    WHERE customer_id = $1 AND order_id = $2
    `,
    [customerId, orderId]
  );

  return mapOrder(result.rows[0]);
};

exports.getOrderByCustomerIdAndOrderIdForUpdate = async (
  customerId,
  orderId,
  client
) => {
  const executor = client || pool;

  const result = await executor.query(
    `
    SELECT *
    FROM orders
    WHERE customer_id = $1 AND order_id = $2
    FOR UPDATE
    `,
    [customerId, orderId]
  );

  if (result.rowCount === 0) return null;

  return mapOrder(result.rows[0]);
};

exports.getOrderByIdForUpdate = async (orderId, client) => {
  const executor = client || pool;

  const result = await executor.query(
    `
    SELECT *
    FROM orders
    WHERE order_id = $1
    FOR UPDATE
    `,
    [orderId]
  );

  if (result.rowCount === 0) return null;

  return mapOrder(result.rows[0]);
};

exports.updateOrderStatus = async ({ orderId, status }, client) => {
  const executor = client || pool;

  const result = await executor.query(
    `
    UPDATE orders
    SET status = $1
    WHERE order_id = $2
    RETURNING *
    `,
    [status, orderId]
  );

  if (result.rowCount === 0) return null;

  return mapOrder(result.rows[0]);
};

exports.listOrdersForManager = async ({ status, startAt, endAt }, client) => {
  const executor = client || pool;
  const conditions = [];
  const params = [];

  if (status) {
    params.push(status);
    conditions.push(`o.status = $${params.length}`);
  }

  if (startAt && endAt) {
    params.push(startAt);
    conditions.push(`o.order_date >= $${params.length}`);
    params.push(endAt);
    conditions.push(`o.order_date < $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await executor.query(
    `
    SELECT
      o.*, 
      u.user_id,
      u.name,
      u.email,
      u.tax_id,
      u.role,
      u.created_at
    FROM orders o
    JOIN users u ON o.customer_id = u.user_id
    ${whereClause}
    ORDER BY o.order_date DESC
    `,
    params
  );

  return result.rows.map((row) => ({
    order: mapOrder(row),
    customer: mapUser(row),
  }));
};