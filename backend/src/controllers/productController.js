const productService = require("../services/productService")

exports.getAllProducts = async (req, res, next) => {
    try {
        const result = await productService.getAllProducts();
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
}