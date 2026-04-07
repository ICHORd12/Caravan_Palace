const productModel = require("../models/productModel")
const ApiError = require("../utils/ApiError");

const normalizeSort = (sort) => {
    if (!sort) {
        return undefined;
    }
    const validSorts = ["price_asc", "price_desc"];
    if (!validSorts.includes(sort)) {
        throw new ApiError(400, "Invalid sort parameter. Valid values are: " + validSorts.join(", "));
    }
    return sort;
}

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

exports.getProductsByCategoryId = async ({category_id, sort}) => {
    const normalizedSort = normalizeSort(sort);
    const products = await productModel.getProductsByCategoryId(category_id, normalizedSort);

    if (!products) {
        throw new ApiError(404, "There is no product with given category id in database ");
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