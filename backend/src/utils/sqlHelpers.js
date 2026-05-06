exports.productImagesSelect = `
  COALESCE(
    json_agg(
      json_build_object(
        'imageId', pi.image_id,
        'url', pi.url,
        'isPrimary', pi.is_primary,
        'createdAt', pi.created_at
      )
      ORDER BY pi.is_primary DESC, pi.created_at ASC
    ) FILTER (WHERE pi.image_id IS NOT NULL),
    '[]'
  ) AS images
`;


exports.productRatingSelect = `
  COALESCE(pr.average_rating, 0) AS average_rating,
  COALESCE(pr.review_count, 0) AS review_count
`;


exports.productRatingJoin = `
  LEFT JOIN (
    SELECT 
      product_id,
      ROUND(AVG(rating)::numeric, 1) AS average_rating,
      COUNT(*)::int AS review_count
    FROM reviews
    WHERE is_approved = 'TRUE'
    GROUP BY product_id
  ) pr ON p.product_id = pr.product_id
`;