const pool = require("../config/db");

const toNumber = (value) => Number(value || 0);

exports.getFinancialSummaryByOrderDateRange = async ({ startAt, endAt }) => {
  const result = await pool.query(
    `
    WITH sold_items AS (
      SELECT
        o.order_id,
        oi.order_item_id,
        oi.quantity,
        oi.purchased_price,
        COALESCE(p.base_price, oi.purchased_price) AS base_price
      FROM orders o
      INNER JOIN order_items oi
        ON o.order_id = oi.order_id
      LEFT JOIN products p
        ON oi.product_id = p.product_id
      WHERE o.order_date >= $1
        AND o.order_date < $2
        AND o.status <> 'cancelled'
    ),
    approved_refunds AS (
      SELECT
        COALESCE(SUM(r.refund_amount), 0) AS refund_loss,
        COUNT(r.refund_id)::int AS refund_count
      FROM refunds r
      INNER JOIN sold_items si
        ON r.order_item_id = si.order_item_id
      WHERE r.status IN ('approved', 'completed')
    )
    SELECT
      (SELECT COUNT(DISTINCT order_id)::int FROM sold_items) AS order_count,
      (SELECT COALESCE(SUM(quantity), 0)::int FROM sold_items) AS items_sold,
      (
        SELECT COALESCE(SUM(quantity * base_price), 0)::numeric
        FROM sold_items
      ) AS potential_revenue,
      (
        SELECT COALESCE(SUM(quantity * purchased_price), 0)::numeric
        FROM sold_items
      ) AS gross_revenue,
      (
        SELECT COALESCE(
          SUM(GREATEST((base_price - purchased_price) * quantity, 0)),
          0
        )::numeric
        FROM sold_items
      ) AS discount_loss,
      (SELECT refund_loss FROM approved_refunds) AS refund_loss,
      (SELECT refund_count FROM approved_refunds) AS refund_count
    `,
    [startAt, endAt]
  );

  const row = result.rows[0] || {};
  const grossRevenue = toNumber(row.gross_revenue);
  const discountLoss = toNumber(row.discount_loss);
  const refundLoss = toNumber(row.refund_loss);
  const totalLoss = discountLoss + refundLoss;
  const netRevenue = grossRevenue - refundLoss;

  return {
    orderCount: Number(row.order_count || 0),
    itemsSold: Number(row.items_sold || 0),
    refundCount: Number(row.refund_count || 0),
    potentialRevenue: toNumber(row.potential_revenue),
    grossRevenue,
    discountLoss,
    refundLoss,
    totalLoss,
    netRevenue,
    profit: netRevenue,
  };
};
