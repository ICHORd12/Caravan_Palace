const pool = require("../config/db");
const { mapReview, mapReviewWithUser } = require("../utils/mappers");

exports.getReviewsByProductId = async (productId) => {
  const result = await pool.query(
    `
    SELECT
      r.review_id,
      r.product_id,
      r.user_id,
      u.name AS user_name,
      r.rating,
      r.comment_text,
      r.is_approved,
      r.created_at,
      r.updated_at
    FROM reviews r
    INNER JOIN users u ON r.user_id = u.user_id
    WHERE r.product_id = $1
      AND r.is_approved = true
    ORDER BY r.created_at DESC
    `,
    [productId]
  );

  return result.rows.map(mapReviewWithUser);
};


exports.hasUserReceivedProduct = async ({ userId, productId }) => {
  const result = await pool.query(
    `
    SELECT 1
    FROM deliveries d
    INNER JOIN orders o ON d.order_id = o.order_id
    WHERE d.customer_id = $1
      AND d.product_id = $2
      AND d.is_completed = true
      AND o.status = 'delivered'
    LIMIT 1
    `,
    [userId, productId]
  );

  return result.rowCount > 0;
};


exports.getReviewByUserAndProduct = async ({ userId, productId }) => {
  const result = await pool.query(
    `
    SELECT *
    FROM reviews
    WHERE user_id = $1
      AND product_id = $2
    LIMIT 1
    `,
    [userId, productId]
  );

  return mapReview(result.rows[0]);
};


exports.getReviewById = async (reviewId) => {
  const result = await pool.query(
    `
    SELECT *
    FROM reviews
    WHERE review_id = $1
    `,
    [reviewId]
  );

  return mapReview(result.rows[0]);
};


exports.getApprovedReviewsByProductIdExceptUser = async ({ productId, userId }) => {
  const result = await pool.query(
    `
    SELECT
      r.review_id,
      r.product_id,
      r.user_id,
      u.name AS user_name,
      r.rating,
      r.comment_text,
      r.is_approved,
      r.created_at,
      r.updated_at
    FROM reviews r
    INNER JOIN users u ON r.user_id = u.user_id
    WHERE r.product_id = $1
      AND r.is_approved = true
      AND r.user_id <> $2
    ORDER BY r.created_at DESC
    `,
    [productId, userId]
  );

  return result.rows.map(mapReviewWithUser);
};


exports.getReviewByUserAndProductWithUser = async ({ userId, productId }) => {
  const result = await pool.query(
    `
    SELECT
      r.review_id,
      r.product_id,
      r.user_id,
      u.name AS user_name,
      r.rating,
      r.comment_text,
      r.is_approved,
      r.created_at,
      r.updated_at
    FROM reviews r
    INNER JOIN users u ON r.user_id = u.user_id
    WHERE r.user_id = $1
      AND r.product_id = $2
    LIMIT 1
    `,
    [userId, productId]
  );

  return mapReviewWithUser(result.rows[0]);
};


exports.getApprovedReviewsByProductId = async (productId) => {
  const result = await pool.query(
    `
    SELECT
      r.review_id,
      r.product_id,
      r.user_id,
      u.name AS user_name,
      r.rating,
      r.comment_text,
      r.is_approved,
      r.created_at,
      r.updated_at
    FROM reviews r
    INNER JOIN users u ON r.user_id = u.user_id
    WHERE r.product_id = $1
      AND r.is_approved = true
    ORDER BY r.created_at DESC
    `,
    [productId]
  );

  return result.rows.map(mapReviewWithUser);
};


exports.createReview = async ({ userId, productId, rating, commentText }) => {
  const result = await pool.query(
    `
    INSERT INTO reviews (
      product_id,
      user_id,
      rating,
      comment_text
    )
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [productId, userId, rating, commentText || null]
  );

  return mapReview(result.rows[0]);
};


exports.deleteReview = async (reviewId) => {
  await pool.query(
    `
    DELETE FROM reviews
    WHERE review_id = $1
    `,
    [reviewId]
  );
};


exports.updateReview = async (reviewId, { comment, rating, approvalStatus }) => {
    const result = await pool.query(
        `
        UPDATE reviews
        SET
            comment = COALESCE($1, comment),
            rating = COALESCE($2, rating),
            approval_status = $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE review_id = $4
        RETURNING *
        `,
        [comment, rating, approvalStatus, reviewId]
    );

    return result.rows[0];
};