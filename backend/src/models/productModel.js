const pool = require("../config/db");
const { mapProduct } = require("../utils/mappers");
const { getOrderByClause } = require("../utils/sorter");
const { productImagesSelect, productRatingSelect, productRatingJoin } = require("../utils/sqlHelpers");

const productCategorySelect = "c.category_name";
const productCategoryJoin = "LEFT JOIN categories c ON p.category_id = c.category_id";
const productCategoryGroupBy = "c.category_name";

const normalizeListParam = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const buildProductListQuery = ({ categoryIds, q, includeInactive }) => {
  const whereClauses = [];
  const params = [];

  const addParam = (value) => {
    params.push(value);
    return `$${params.length}`;
  };

  if (!includeInactive) {
    whereClauses.push("p.is_active = TRUE");
  }

  const normalizedCategoryIds = normalizeListParam(categoryIds);
  if (normalizedCategoryIds.length > 0) {
    whereClauses.push(`p.category_id = ANY(${addParam(normalizedCategoryIds)}::uuid[])`);
  }

  const searchTerm = typeof q === "string" ? q.trim() : "";
  if (searchTerm) {
    const likePattern = `%${searchTerm}%`;
    const searchParam = addParam(likePattern);
    whereClauses.push(`(p.name ILIKE ${searchParam} OR p.description ILIKE ${searchParam} OR p.model ILIKE ${searchParam})`);
  }

  return {
    whereClause: whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "",
    params,
  };
};

exports.getAllProducts = async (filtersOrSort) => {
  const filters = typeof filtersOrSort === "string" ? { sort: filtersOrSort } : (filtersOrSort || {});
  const { sort, categoryIds, q } = filters;
  const { whereClause, params } = buildProductListQuery({
    categoryIds,
    q,
    includeInactive: false,
  });

  const result = await pool.query(
    `
    SELECT 
      p.*,
      ${productCategorySelect},
      ${productImagesSelect},
      ${productRatingSelect}
    FROM products p
    ${productCategoryJoin}
    LEFT JOIN product_images pi ON p.product_id = pi.product_id
    ${productRatingJoin}
    ${whereClause}
    GROUP BY p.product_id, ${productCategoryGroupBy}, pr.average_rating, pr.review_count
    ${getOrderByClause(sort)}
    `
    , params
  );

  return result.rows.map(mapProduct);
};

exports.getAllProductsForManager = async (filtersOrSort) => {
  const filters = typeof filtersOrSort === "string" ? { sort: filtersOrSort } : (filtersOrSort || {});
  const { sort, categoryIds, q } = filters;
  const { whereClause, params } = buildProductListQuery({
    categoryIds,
    q,
    includeInactive: true,
  });

  const result = await pool.query(
    `
    SELECT 
      p.*,
      ${productCategorySelect},
      ${productImagesSelect},
      ${productRatingSelect}
    FROM products p
    ${productCategoryJoin}
    LEFT JOIN product_images pi ON p.product_id = pi.product_id
    ${productRatingJoin}
    ${whereClause}
    GROUP BY p.product_id, ${productCategoryGroupBy}, pr.average_rating, pr.review_count
    ${getOrderByClause(sort)}
    `
    , params
  );

  return result.rows.map(mapProduct);
};


exports.getProductsByCategoryName = async (category_name, sort) => {
  const result = await pool.query(
    `
    SELECT 
      p.*,
      c.category_name,
      ${productImagesSelect},
      ${productRatingSelect}
    FROM products p
    INNER JOIN categories c ON p.category_id = c.category_id
    LEFT JOIN product_images pi ON p.product_id = pi.product_id
    ${productRatingJoin}
    WHERE c.category_name = $1
      AND p.is_active = TRUE
      AND c.is_active = TRUE
    GROUP BY p.product_id, c.category_name, pr.average_rating, pr.review_count
    ${getOrderByClause(sort)}
    `,
    [category_name]
  );

  return result.rows.map(mapProduct);
};

exports.getProductsByCategoryNameForManager = async (category_name, sort) => {
  const result = await pool.query(
    `
    SELECT 
      p.*,
      c.category_name,
      ${productImagesSelect},
      ${productRatingSelect}
    FROM products p
    INNER JOIN categories c ON p.category_id = c.category_id
    LEFT JOIN product_images pi ON p.product_id = pi.product_id
    ${productRatingJoin}
    WHERE c.category_name = $1
      AND c.is_active = TRUE
    GROUP BY p.product_id, c.category_name, pr.average_rating, pr.review_count
    ${getOrderByClause(sort)}
    `,
    [category_name]
  );

  return result.rows.map(mapProduct);
};


exports.getProductById = async (productId) => {
  const result = await pool.query(
    `
    SELECT 
      product_id,
      name,
      current_price,
      quantity_in_stocks
    FROM products
    WHERE product_id = $1
    `,
    [productId]
  );

  return mapProduct(result.rows[0]);
};


exports.getActiveProductById = async (productId) => {
  const result = await pool.query(
    `
    SELECT 
      product_id,
      name,
      current_price,
      quantity_in_stocks
    FROM products
    WHERE product_id = $1
      AND is_active = TRUE
    `,
    [productId]
  );

  return mapProduct(result.rows[0] || null);
};


exports.getProductDetailsById = async (productId) => {
  const result = await pool.query(
    `
    SELECT 
      p.*,
      ${productCategorySelect},
      ${productImagesSelect},
      ${productRatingSelect}
    FROM products p
    ${productCategoryJoin}
    LEFT JOIN product_images pi ON p.product_id = pi.product_id
    ${productRatingJoin}
    WHERE p.product_id = $1
      AND p.is_active = TRUE
    GROUP BY p.product_id, ${productCategoryGroupBy}, pr.average_rating, pr.review_count
    `,
    [productId]
  );

  return mapProduct(result.rows[0]);
};


exports.getProductsByIds = async (productIds, sort) => {
  const result = await pool.query(
    `
    SELECT 
      p.*,
      ${productCategorySelect},
      ${productImagesSelect},
      ${productRatingSelect}
    FROM products p
    ${productCategoryJoin}
    LEFT JOIN product_images pi ON p.product_id = pi.product_id
    ${productRatingJoin}
    WHERE p.product_id = ANY($1::uuid[])
      AND p.is_active = TRUE
    GROUP BY p.product_id, ${productCategoryGroupBy}, pr.average_rating, pr.review_count
    ${getOrderByClause(sort)}
    `,
    [productIds]
  );

  return result.rows.map(mapProduct);
};

exports.getProductsByIdsForManager = async (productIds, sort) => {
  const result = await pool.query(
    `
    SELECT 
      p.*,
      ${productCategorySelect},
      ${productImagesSelect},
      ${productRatingSelect}
    FROM products p
    ${productCategoryJoin}
    LEFT JOIN product_images pi ON p.product_id = pi.product_id
    ${productRatingJoin}
    WHERE p.product_id = ANY($1::uuid[])
    GROUP BY p.product_id, ${productCategoryGroupBy}, pr.average_rating, pr.review_count
    ${getOrderByClause(sort)}
    `,
    [productIds]
  );

  return result.rows.map(mapProduct);
};


exports.getProductByIdForUpdate = async (productId, client) => {
  const executor = client || pool;

  const result = await executor.query(
    `
    SELECT
      product_id,
      name,
      current_price,
      quantity_in_stocks
    FROM products
    WHERE product_id = $1
    FOR UPDATE
    `,
    [productId]
  );

  return mapProduct(result.rows[0] || null);
};


exports.getProductDiscountForUpdate = async (productId, client) => {
  const executor = client || pool;

  const result = await executor.query(
    `
    SELECT
      product_id,
      name,
      model,
      base_price,
      current_price,
      discount_rate
    FROM products
    WHERE product_id = $1
    FOR UPDATE
    `,
    [productId]
  );

  return mapProduct(result.rows[0] || null);
};


exports.updateProductDiscount = async ({ productId, discountRate }, client) => {
  const executor = client || pool;

  const result = await executor.query(
    `
    UPDATE products
    SET discount_rate = $1,
        current_price = ROUND((base_price * (1 - ($1::numeric / 100)))::numeric, 2),
        updated_at = NOW()
    WHERE product_id = $2
    RETURNING *
    `,
    [discountRate, productId]
  );

  return mapProduct(result.rows[0] || null);
};

exports.updateProductBasePrice = async ({ productId, basePrice }, client) => {
  const executor = client || pool;

  const result = await executor.query(
    `
    UPDATE products
    SET base_price = $1,
        current_price = ROUND(($1 * (1 - (COALESCE(discount_rate, 0)::numeric / 100)))::numeric, 2),
        is_active = CASE
          WHEN COALESCE(base_price, 0) <= 0 THEN true
          ELSE is_active
        END,
        updated_at = NOW()
    WHERE product_id = $2
    RETURNING *
    `,
    [basePrice, productId]
  );

  return mapProduct(result.rows[0] || null);
};

exports.getProductPricingById = async (productId, client) => {
  const executor = client || pool;

  const result = await executor.query(
    `
    SELECT
      product_id,
      base_price,
      is_active
    FROM products
    WHERE product_id = $1
    `,
    [productId]
  );

  const row = result.rows[0];

  if (!row) return null;

  return {
    productId: row.product_id,
    basePrice: row.base_price,
    isActive: row.is_active,
  };
};

exports.createProduct = async (
  {
    categoryId,
    name,
    model,
    serialNumber,
    description,
    quantityInStocks,
    basePrice,
    currentPrice,
    warrantyStatus,
    distributorInfo,
    berthCount,
    fuelType,
    weightKg,
    hasKitchen,
    discountRate,
    isActive,
  },
  client
) => {
  const executor = client || pool;

  const result = await executor.query(
    `
    INSERT INTO products (
      category_id,
      name,
      model,
      serial_number,
      description,
      quantity_in_stocks,
      base_price,
      current_price,
      warranty_status,
      distributor_info,
      berth_count,
      fuel_type,
      weight_kg,
      has_kitchen,
      discount_rate,
      is_active
    )
    VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9, $10,
      $11, $12, $13, $14, $15, $16
    )
    RETURNING *
    `,
    [
      categoryId,
      name,
      model,
      serialNumber,
      description,
      quantityInStocks,
      basePrice,
      currentPrice,
      warrantyStatus,
      distributorInfo,
      berthCount,
      fuelType,
      weightKg,
      hasKitchen,
      discountRate,
      isActive,
    ]
  );

  return mapProduct(result.rows[0] || null);
};

exports.createProductImages = async ({ productId, images }, client) => {
  if (!Array.isArray(images) || images.length === 0) {
    return [];
  }

  const executor = client || pool;
  const values = [productId];
  const placeholders = images
    .map((image, index) => {
      const urlIndex = index * 2 + 2;
      const primaryIndex = index * 2 + 3;
      values.push(image.url, image.isPrimary);
      return `($1, $${urlIndex}, $${primaryIndex})`;
    })
    .join(", ");

  const result = await executor.query(
    `
    INSERT INTO product_images (product_id, url, is_primary)
    VALUES ${placeholders}
    RETURNING image_id, url, is_primary, created_at
    `,
    values
  );

  return result.rows.map((row) => ({
    imageId: row.image_id,
    url: row.url,
    isPrimary: row.is_primary,
    createdAt: row.created_at,
  }));
};

exports.getProductDetailsByIdForManager = async (productId, client) => {
  const executor = client || pool;

  const result = await executor.query(
    `
    SELECT 
      p.*,
      ${productCategorySelect},
      ${productImagesSelect},
      ${productRatingSelect}
    FROM products p
    ${productCategoryJoin}
    LEFT JOIN product_images pi ON p.product_id = pi.product_id
    ${productRatingJoin}
    WHERE p.product_id = $1
    GROUP BY p.product_id, ${productCategoryGroupBy}, pr.average_rating, pr.review_count
    `,
    [productId]
  );

  return mapProduct(result.rows[0]);
};


exports.updateProductIsActive = async ({ productId, isActive }, client) => {
  const executor = client || pool;

  const result = await executor.query(
    `
    UPDATE products
    SET is_active = $1,
        updated_at = NOW()
    WHERE product_id = $2
    RETURNING product_id, is_active
    `,
    [isActive, productId]
  );

  const row = result.rows[0];

  if (!row) return null;

  return {
    productId: row.product_id,
    isActive: row.is_active,
  };
};

exports.updateProductStock = async ({ productId, quantityInStocks }, client) => {
  const executor = client || pool;

  const result = await executor.query(
    `
    UPDATE products
    SET quantity_in_stocks = $1,
        updated_at = NOW()
    WHERE product_id = $2
    RETURNING *
    `,
    [quantityInStocks, productId]
  );

  return mapProduct(result.rows[0] || null);
};


exports.searchProductsByNameOrDescription = async (searchTerm, sort) => {
  const likePattern = "%" + searchTerm + "%";

  const result = await pool.query(
    `
    SELECT 
      p.*,
      ${productCategorySelect},
      ${productImagesSelect},
      ${productRatingSelect}
    FROM products p
    ${productCategoryJoin}
    LEFT JOIN product_images pi ON p.product_id = pi.product_id
    ${productRatingJoin}
    WHERE (p.name ILIKE $1 OR p.description ILIKE $1)
      AND p.is_active = TRUE
    GROUP BY p.product_id, ${productCategoryGroupBy}, pr.average_rating, pr.review_count
    ${getOrderByClause(sort)}
    `,
    [likePattern]
  );

  return result.rows.map(mapProduct);
};

exports.searchProductsByNameOrDescriptionForManager = async (searchTerm, sort) => {
  const likePattern = "%" + searchTerm + "%";

  const result = await pool.query(
    `
    SELECT 
      p.*,
      ${productCategorySelect},
      ${productImagesSelect},
      ${productRatingSelect}
    FROM products p
    ${productCategoryJoin}
    LEFT JOIN product_images pi ON p.product_id = pi.product_id
    ${productRatingJoin}
    WHERE (p.name ILIKE $1 OR p.description ILIKE $1)
    GROUP BY p.product_id, ${productCategoryGroupBy}, pr.average_rating, pr.review_count
    ${getOrderByClause(sort)}
    `,
    [likePattern]
  );

  return result.rows.map(mapProduct);
};

exports.decreaseStock = async ({ productId, quantity }, client) => {
  const executor = client || pool;

  const result = await executor.query(
    `
    UPDATE products
    SET quantity_in_stocks = quantity_in_stocks - $1
    WHERE product_id = $2
      AND quantity_in_stocks >= $1
    RETURNING product_id, quantity_in_stocks
    `,
    [quantity, productId]
  );

  if (result.rowCount === 0) {
    throw new Error("Failed to decrease stock");
  }

  return result.rows[0];
};

exports.increaseStock = async ({ productId, quantity }, client) => {
  const executor = client || pool;

  const result = await executor.query(
    `
    UPDATE products
    SET quantity_in_stocks = quantity_in_stocks + $1
    WHERE product_id = $2
    RETURNING product_id, quantity_in_stocks
    `,
    [quantity, productId]
  );

  if (result.rowCount === 0) {
    throw new Error("Failed to increase stock");
  }

  return result.rows[0];
};
