const pool = require("../config/db");
const { mapReview, mapReviewWithUser } = require("../utils/mappers");

const APPROVED_REVIEW_STATUS = "approved";
const PENDING_REVIEW_STATUS = "pending";

const reviewSelectColumns = `
      r.review_id,
      r.product_id,
      r.user_id,
      u.name AS user_name,
      r.rating,
      r.comment_text,
      r.status,
      r.moderation_comment,
      r.is_approved,
      r.created_at,
      r.updated_at
`;

exports.getReviewsByProductId = async (productId) => {
  const result = await pool.query(
    `
    SELECT
${reviewSelectColumns}
    FROM reviews r
    INNER JOIN users u ON r.user_id = u.user_id
    WHERE r.product_id = $1
      AND r.status = $2
    ORDER BY r.created_at DESC
    `,
    [productId, APPROVED_REVIEW_STATUS]
  );

  return result.rows.map(mapReviewWithUser);
};


exports.getPendingReviews = async () => {
  const result = await pool.query(
    `
    SELECT
${reviewSelectColumns}
    FROM reviews r
    INNER JOIN users u ON r.user_id = u.user_id
    WHERE r.status = $1
    ORDER BY r.created_at DESC
    `,
    [PENDING_REVIEW_STATUS]
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
${reviewSelectColumns}
    FROM reviews r
    INNER JOIN users u ON r.user_id = u.user_id
    WHERE r.product_id = $1
      AND r.status = $2
      AND r.user_id <> $3
    ORDER BY r.created_at DESC
    `,
    [productId, APPROVED_REVIEW_STATUS, userId]
  );

  return result.rows.map(mapReviewWithUser);
};


exports.getReviewByUserAndProductWithUser = async ({ userId, productId }) => {
  const result = await pool.query(
    `
    SELECT
${reviewSelectColumns}
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
${reviewSelectColumns}
    FROM reviews r
    INNER JOIN users u ON r.user_id = u.user_id
    WHERE r.product_id = $1
      AND r.status = $2
    ORDER BY r.created_at DESC
    `,
    [productId, APPROVED_REVIEW_STATUS]
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
      comment_text,
      status,
      moderation_comment,
      is_approved
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
    `,
    [productId, userId, rating, commentText, PENDING_REVIEW_STATUS, null, false]
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
      comment_text = COALESCE($1, comment_text),
      rating = COALESCE($2, rating),
      status = COALESCE($3, status),
      moderation_comment = $4,
      is_approved = CASE
        WHEN COALESCE($3, status) = 'approved' THEN true
        WHEN COALESCE($3, status) = 'rejected' THEN false
        ELSE false
      END,
      updated_at = CURRENT_TIMESTAMP
    WHERE review_id = $5
    RETURNING *
    `,
    [comment, rating, approvalStatus, null, reviewId]
  );

  return mapReview(result.rows[0]);
};


exports.getReviewByIdForModeration = async (reviewId) => {
  const result = await pool.query(
    `
    SELECT *
    FROM reviews
    WHERE review_id = $1
    LIMIT 1
    `,
    [reviewId]
  );

  return mapReview(result.rows[0]);
};


exports.updateReviewModeration = async ({ reviewId, status, moderationComment }) => {
  const result = await pool.query(
    `
    UPDATE reviews
    SET
      status = $1,
      moderation_comment = $2,
      is_approved = CASE WHEN $1 = 'approved' THEN true ELSE false END,
      updated_at = CURRENT_TIMESTAMP
    WHERE review_id = $3
      AND status = 'pending'
    RETURNING *
    `,
    [status, moderationComment, reviewId]
  );

  return mapReview(result.rows[0]);
};