const productModel = require("../models/productModel");
const ApiError = require("../utils/ApiError");

exports.getAllProducts = async() => {
    const products = await productModel.getAllProducts();
    if (products.length == 0) {
        throw new ApiError(404, "There is no product in database");
    }

    return {
        message: "Products fetched successfully",
        products
    };  
};

exports.getProductsByCategoryName = async ({category_name}) => {
    const products = await productModel.getProductsByCategoryName(category_name);

    if (products.length === 0) {
        throw new ApiError(404, "There is no product with given category name in database ");
    }

    return {
        message: "Products fetched successfully",
        products
    };
};
