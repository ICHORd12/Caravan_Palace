const categoryModel = require("../models/categoryModel");
const ApiError = require("../utils/ApiError");

const assertProductManager = (userRole, action = "update categories") => {
  if (userRole !== "product_manager") {
    throw new ApiError(403, `Only product managers can ${action}`);
  }
};

const normalizeIsActive = (value) => {
  if (value === undefined || value === null) {
    throw new ApiError(400, "isActive is required");
  }

  if (typeof value === "boolean") return value;

  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (["true", "1", "yes", "y"].includes(normalized)) return true;
    if (["false", "0", "no", "n"].includes(normalized)) return false;
  }

  throw new ApiError(400, "isActive must be a boolean");
};

const normalizeCategoryName = (value) => {
  if (typeof value !== "string") {
    throw new ApiError(400, "categoryName is required");
  }

  const normalizedValue = value.trim().replace(/\s+/g, " ");

  if (!normalizedValue) {
    throw new ApiError(400, "categoryName is required");
  }

  return normalizedValue;
};

exports.getAllCategories = async () => {
  const categories = await categoryModel.getAllCategories({
    includeInactive: false,
  });

  return {
    message: "Categories fetched successfully",
    categories,
  };
};

exports.createCategory = async ({ categoryName, userRole }) => {
  assertProductManager(userRole, "create categories");

  const normalizedCategoryName = normalizeCategoryName(categoryName);
  const existingCategory = await categoryModel.getCategoryByName(
    normalizedCategoryName
  );

  if (existingCategory) {
    throw new ApiError(409, "Category already exists");
  }

  const category = await categoryModel.createCategory({
    categoryName: normalizedCategoryName,
    isActive: true,
  });

  return {
    message: "Category created successfully",
    category,
  };
};

exports.updateCategoryActivation = async ({ categoryId, isActive, userRole }) => {
  assertProductManager(userRole, "activate or deactivate categories");

  if (!categoryId) {
    throw new ApiError(400, "Category ID is required");
  }

  const normalizedIsActive = normalizeIsActive(isActive);
  const updatedCategory = await categoryModel.updateCategoryIsActive({
    categoryId,
    isActive: normalizedIsActive,
  });

  if (!updatedCategory) {
    throw new ApiError(404, "Category not found");
  }

  return {
    message: normalizedIsActive
      ? "Category activated successfully"
      : "Category deactivated successfully",
    category: updatedCategory,
  };
};
