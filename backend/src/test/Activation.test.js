/**
 * Unit tests for product/category activation services.
 */

const { describe, test, expect, afterEach } = require("@jest/globals");
const productService = require("../services/productService");
const categoryService = require("../services/categoryService");
const productModel = require("../models/productModel");
const categoryModel = require("../models/categoryModel");

describe("activation services", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("product activation rejects non product managers", async () => {
    await expect(
      productService.updateProductActivation({
        productId: "prod-1",
        isActive: true,
        userRole: "customer",
      })
    ).rejects.toThrow(/product managers/i);
  });

  test("product activation updates is_active", async () => {
    jest
      .spyOn(productModel, "getProductPricingById")
      .mockResolvedValue({ productId: "prod-1", basePrice: 1500, isActive: false });
    const updateSpy = jest
      .spyOn(productModel, "updateProductIsActive")
      .mockResolvedValue({ productId: "prod-1", isActive: true });

    const result = await productService.updateProductActivation({
      productId: "prod-1",
      isActive: true,
      userRole: "product_manager",
    });

    expect(updateSpy).toHaveBeenCalledWith({
      productId: "prod-1",
      isActive: true,
    });
    expect(result).toMatchObject({
      message: "Product activated successfully",
      product: { productId: "prod-1", isActive: true },
    });
  });

  test("product activation rejects when base price is missing", async () => {
    jest
      .spyOn(productModel, "getProductPricingById")
      .mockResolvedValue({ productId: "prod-1", basePrice: 0, isActive: false });

    await expect(
      productService.updateProductActivation({
        productId: "prod-1",
        isActive: true,
        userRole: "product_manager",
      })
    ).rejects.toThrow(/base price/i);
  });

  test("category activation rejects non product managers", async () => {
    await expect(
      categoryService.updateCategoryActivation({
        categoryId: "cat-1",
        isActive: false,
        userRole: "sales_manager",
      })
    ).rejects.toThrow(/product managers/i);
  });

  test("category activation updates is_active", async () => {
    const updateSpy = jest
      .spyOn(categoryModel, "updateCategoryIsActive")
      .mockResolvedValue({
        categoryId: "cat-2",
        categoryName: "Luxury",
        isActive: false,
      });

    const result = await categoryService.updateCategoryActivation({
      categoryId: "cat-2",
      isActive: false,
      userRole: "product_manager",
    });

    expect(updateSpy).toHaveBeenCalledWith({
      categoryId: "cat-2",
      isActive: false,
    });
    expect(result).toMatchObject({
      message: "Category deactivated successfully",
      category: {
        categoryId: "cat-2",
        categoryName: "Luxury",
        isActive: false,
      },
    });
  });

  test("category creation rejects non product managers", async () => {
    await expect(
      categoryService.createCategory({
        categoryName: "Camper Vans",
        userRole: "sales_manager",
      })
    ).rejects.toThrow(/product managers/i);
  });

  test("category creation validates categoryName", async () => {
    await expect(
      categoryService.createCategory({
        categoryName: "   ",
        userRole: "product_manager",
      })
    ).rejects.toThrow(/categoryName is required/i);
  });

  test("category creation rejects duplicate category names", async () => {
    jest.spyOn(categoryModel, "getCategoryByName").mockResolvedValue({
      categoryId: "cat-7",
      categoryName: "Camper Vans",
      isActive: false,
    });

    await expect(
      categoryService.createCategory({
        categoryName: "Camper Vans",
        userRole: "product_manager",
      })
    ).rejects.toThrow(/already exists/i);
  });

  test("category creation creates category with normalized name", async () => {
    const findSpy = jest
      .spyOn(categoryModel, "getCategoryByName")
      .mockResolvedValue(null);
    const createSpy = jest
      .spyOn(categoryModel, "createCategory")
      .mockResolvedValue({
        categoryId: "cat-8",
        categoryName: "Camper Vans",
        isActive: true,
      });

    const result = await categoryService.createCategory({
      categoryName: "  Camper   Vans  ",
      userRole: "product_manager",
    });

    expect(findSpy).toHaveBeenCalledWith("Camper Vans");
    expect(createSpy).toHaveBeenCalledWith({
      categoryName: "Camper Vans",
      isActive: true,
    });

    expect(result).toMatchObject({
      message: "Category created successfully",
      category: {
        categoryId: "cat-8",
        categoryName: "Camper Vans",
        isActive: true,
      },
    });
  });
});
