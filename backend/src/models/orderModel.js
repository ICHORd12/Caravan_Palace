const pool = require("../config/db");
const {mapOrder} = require("../utils/mappers");

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