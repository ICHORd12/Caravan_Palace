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
      category_name
    FROM categories
    ${whereClause}
    ORDER BY category_name ASC
    `,
    params
  );

  return result.rows.map(mapCategory);
};
