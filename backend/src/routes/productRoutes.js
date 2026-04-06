const express = require("express");
const productController = require("../controllers/productController");

const router = express.Router();

router.get("/all", productController.getAllProducts);
router.get("/category_id", productController.getProductsByCategoryId);
router.get("/search", productController.searchProductsByNameOrDescription);

module.exports = router;

