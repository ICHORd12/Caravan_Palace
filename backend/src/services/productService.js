const productModel = require("../models/productModel");
const ApiError = require("../utils/ApiError");

exports.getAllProducts = async (query = {}) => {
  let products;

  if (query.search) {
    products = await productModel.searchProducts(query.search);
  } else {
    products = await productModel.getAllProducts(query.sort, query.order);
  }

  if (query.category_id) {
    products = products.filter(
      (p) => p.category_id === Number(query.category_id)
    );
  }

  // If we searched but also need to sort
  if (query.search && query.sort) {
    if (query.sort === "price") {
      products.sort((a, b) =>
        query.order === "desc"
          ? b.current_price - a.current_price
          : a.current_price - b.current_price
      );
    } else if (query.sort === "popularity") {
      products.sort((a, b) => b.popularity - a.popularity);
    }
  }

  return {
    message: "Products fetched successfully",
    products,
  };
};

exports.getProductById = async (id) => {
  const product = await productModel.getProductById(id);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return {
    message: "Product fetched successfully",
    product,
  };
};

exports.getProductsByCategoryId = async (categoryId) => {
  const products = await productModel.getProductsByCategoryId(categoryId);

  return {
    message: "Products fetched successfully",
    products,
  };
};

exports.getCategories = async () => {
  const categories = await productModel.getCategories();
  return {
    message: "Categories fetched successfully",
    categories,
  };
};