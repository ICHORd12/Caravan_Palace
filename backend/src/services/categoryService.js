const categoryModel = require("../models/categoryModel");

const normalizeIncludeInactive = (value) => {
  if (value === undefined || value === null) return false;

  if (typeof value === "boolean") return value;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (!normalized) return false;

    return ["true", "1", "yes", "y"].includes(normalized);
  }

  return Boolean(value);
};

exports.getAllCategories = async ({ includeInactive }) => {
  const normalizedIncludeInactive = normalizeIncludeInactive(includeInactive);
  const categories = await categoryModel.getAllCategories({
    includeInactive: normalizedIncludeInactive,
  });

  return {
    message: "Categories fetched successfully",
    categories,
  };
};
