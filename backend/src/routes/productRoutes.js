const express = require("express");
const productController = require("../controllers/productController");

const router = express.Router();

router.get("/all", productController.getAllProducts);
router.get("/category_name", productController.getProductsByCategoryName);
router.get("/search", productController.searchProductsByNameOrDescription);
router.post("/by-ids", productController.getProductsByIds);

module.exports = router;

