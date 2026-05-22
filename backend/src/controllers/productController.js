const productService = require("../services/productService")

exports.getAllProducts = async (req, res, next) => {
    try {
    const userRole = req.user?.role || null;
    const result = await productService.getAllProducts({ ...req.query, userRole });
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
}

exports.getProductsByCategoryName = async (req, res, next) => {
    try {
    const userRole = req.user?.role || null;
    const result = await productService.getProductsByCategoryName({ ...req.body, userRole });
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
}


exports.getProductsByIds = async (req, res, next) => {
  try {
    const userRole = req.user?.role || null;
    const result = await productService.getProductsByIds({ ...req.body, userRole });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};


exports.getProductDetails = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const userId = req.user?.userId || null;
    const userRole = req.user?.role || null;

    const result = await productService.getProductDetails({
      productId,
      userId,
      userRole,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};


exports.searchProductsByNameOrDescription = async (req, res, next) => {
    try {
    const userRole = req.user?.role || null;
    const result = await productService.searchProductsByNameOrDescription({ ...req.query, userRole });
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

exports.updateProductActivation = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const userRole = req.user.role;
    const isActive = req.body.isActive ?? req.body.is_active;

    const result = await productService.updateProductActivation({
      productId,
      isActive,
      userRole,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

exports.updateProductDiscount = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const userRole = req.user.role;

    const result = await productService.updateProductDiscount({
      productId,
      discountRate: req.body.discountRate ?? req.body.discount_rate,
      userRole,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

exports.updateProductBasePrice = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const userRole = req.user.role;

    const result = await productService.updateProductBasePrice({
      productId,
      basePrice: req.body.basePrice ?? req.body.base_price,
      userRole,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

exports.updateProductStock = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const userRole = req.user.role;
    const quantityInStocks =
      req.body.quantityInStocks ?? req.body.quantity_in_stocks;

    const result = await productService.updateProductStock({
      productId,
      quantityInStocks,
      userRole,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const userRole = req.user.role;

    const result = await productService.createProduct({
      payload: req.body,
      userRole,
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};
