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