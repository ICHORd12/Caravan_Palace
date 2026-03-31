const express = require("express");
const productController = require("../controllers/productController");

const router = express.Router();

router.get("/all", productController.getAllProducts);
router.get("/categories", productController.getCategories);
router.get("/category/:categoryId", productController.getProductsByCategoryId);
router.get("/:id", productController.getProductById);

module.exports = router;
