const productService = require("../services/productService")

exports.getAllProducts = async (req, res, next) => {
    try {
        const result = await productService.getAllProducts(req.query);
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
}

exports.getProductsByCategoryName = async (req, res, next) => {
    try {
        const result = await productService.getProductsByCategoryName(req.body);
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
}


exports.getProductsByIds = async (req, res, next) => {
  try {
    const result = await productService.getProductsByIds(req.body);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};


exports.searchProductsByNameOrDescription = async (req, res, next) => {
    try {
        const result = await productService.searchProductsByNameOrDescription(req.query);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};
