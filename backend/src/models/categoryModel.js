const pool = require("../config/db");
const { mapCategory } = require("../utils/mappers");

exports.getAllCategories = async ({ includeInactive }) => {
  const params = [];
  let whereClause = "";

  if (!includeInactive) {
    params.push(true);
    whereClause = "WHERE is_active = $1";
  }

  const result = await pool.query(
    `
    SELECT
      category_id,
      category_name,
      is_active
    FROM categories
    ${whereClause}
    ORDER BY category_name ASC
    `,
    params
  );

  return result.rows.map(mapCategory);
};

exports.updateCategoryIsActive = async ({ categoryId, isActive }, client) => {
  const executor = client || pool;

  const result = await executor.query(
    `
    UPDATE categories
    SET is_active = $1
    WHERE category_id = $2
    RETURNING category_id, category_name, is_active
    `,
    [isActive, categoryId]
  );

  const row = result.rows[0];

  if (!row) return null;

  return {
    categoryId: row.category_id,
    categoryName: row.category_name,
    isActive: row.is_active,
  };
};

exports.getCategoryById = async (categoryId, client) => {
  const executor = client || pool;

  const result = await executor.query(
    `
    SELECT
      category_id,
      category_name,
      is_active
    FROM categories
    WHERE category_id = $1
    `,
    [categoryId]
  );

  const row = result.rows[0];

  if (!row) return null;

  return {
    categoryId: row.category_id,
    categoryName: row.category_name,
    isActive: row.is_active,
  };
};
