const productService = require("../services/productService");

exports.getAllProducts = async (req, res, next) => {
  try {
    const result = await productService.getAllProducts(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

exports.getProductById = async (req, res, next) => {
  try {
    const result = await productService.getProductById(req.params.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

exports.getProductsByCategoryId = async (req, res, next) => {
  try {
    const result = await productService.getProductsByCategoryId(req.params.categoryId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

exports.getCategories = async (req, res, next) => {
  try {
    const result = await productService.getCategories();
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};