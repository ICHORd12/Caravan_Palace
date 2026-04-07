const productService = require("../services/productService")

exports.getAllProducts = async (req, res, next) => {
    try {
        const result = await productService.getAllProducts(req.query);
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
}

exports.getProductsByCategoryId = async (req, res, next) => {
    try {
        const result = await productService.getProductsByCategoryId(req.query);
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
}


exports.searchProductsByNameOrDescription = async (req, res, next) => {
    try {
        const result = await productService.searchProductsByNameOrDescription(req.query);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};