const productModel = require("../models/productModel")

exports.getAllProducts = async() => {
    const products = await productModel.getAllProducts();
    if (!products) {
        throw new ApiError(404, "There is no product in database");
    }

    return {
        message: "Products fetched successfully",
        products
    };  
};

exports.getProductsByCategoryId = async ({category_id}) => {
    const products = await productModel.getProductsByCategoryId(category_id);

    if (!products) {
        throw new ApiError(404, "There is no product with given category id in database ");
    }

    return {
        message: "Products fetched successfully",
        products
    };
};