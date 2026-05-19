const express = require("express");
const productController = require("../controllers/productController");
const authMiddleware = require("../middlewares/authMiddleware");
const optionalAuthMiddleware = require("../middlewares/optionalAuthMiddleware");

const router = express.Router();

router.get("/all", productController.getAllProducts);
router.get("/category_name", productController.getProductsByCategoryName);
router.get("/search", productController.searchProductsByNameOrDescription);
router.post("/by-ids", productController.getProductsByIds);
router.patch("/:productId/discount", authMiddleware, productController.updateProductDiscount);
router.patch("/:productId/base-price", authMiddleware, productController.updateProductBasePrice);
router.get("/:productId/details", optionalAuthMiddleware, productController.getProductDetails);

module.exports = router;
