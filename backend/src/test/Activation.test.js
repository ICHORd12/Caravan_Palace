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
});
