const productModel = require("../models/productModel")
const ApiError = require("../utils/ApiError");
const { normalizeSort } = require("../utils/sorter");

exports.getAllProducts = async({sort}) => {
    const normalizedSort = normalizeSort(sort);
    const products = await productModel.getAllProducts(normalizedSort);
    if (!products) {
        throw new ApiError(404, "There is no product in database");
    }

    return {
        message: "Products fetched successfully",
        products
    };  
};

exports.getProductsByCategoryName = async ({category_name, sort}) => {
    const normalizedSort = normalizeSort(sort);
    const products = await productModel.getProductsByCategoryName(category_name);

    if (products.length === 0) {
        throw new ApiError(404, "There is no product with given category name in database ");
    }

    return {
        message: "Products fetched successfully",
        products
    };
};


exports.searchProductsByNameOrDescription = async ({q, sort}) => {
    const normalizedSort = normalizeSort(sort);
    const searchTerm = typeof q === "string" ? q.trim() : "";
    
    if (!searchTerm) {
        throw new ApiError(400, "Query parameter q is required");
    }

    const products = await productModel.searchProductsByNameOrDescription(searchTerm, normalizedSort);

    return {
        message: "Products fetched successfully",
        products,
    };
};
