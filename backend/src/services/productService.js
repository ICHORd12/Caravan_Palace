const productModel = require("../models/productModel")
const ApiError = require("../utils/ApiError");

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


exports.searchProductsByNameOrDescription = async ({q}) => {
    const searchTerm = typeof q === "string" ? q.trim() : "";
    
    if (!searchTerm) {
        throw new ApiError(400, "Query parameter q is required");
    }

    const products = await productModel.searchProductsByNameOrDescription(searchTerm);

    return {
        message: "Products fetched successfully",
        products,
    };
};