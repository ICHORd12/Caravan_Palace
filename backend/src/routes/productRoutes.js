const express = require("express");
const productController = require("../controllers/productController");
const authMiddleware = require("../middlewares/authMiddleware");
const optionalAuthMiddleware = require("../middlewares/optionalAuthMiddleware");

const router = express.Router();

router.get("/all", optionalAuthMiddleware, productController.getAllProducts);
router.get(
	"/category_name",
	optionalAuthMiddleware,
	productController.getProductsByCategoryName
);
router.get(
	"/search",
	optionalAuthMiddleware,
	productController.searchProductsByNameOrDescription
);
router.post("/by-ids", optionalAuthMiddleware, productController.getProductsByIds);
router.post("/", authMiddleware, productController.createProduct);
router.patch("/:productId/activation", authMiddleware, productController.updateProductActivation);
router.patch("/:productId/stock", authMiddleware, productController.updateProductStock);
router.patch("/:productId/discount", authMiddleware, productController.updateProductDiscount);
router.patch("/:productId/base-price", authMiddleware, productController.updateProductBasePrice);
router.get("/:productId/details", optionalAuthMiddleware, productController.getProductDetails);

module.exports = router;
