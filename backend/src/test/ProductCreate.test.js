const { describe, test, expect, beforeEach, afterEach } = require("@jest/globals");
const productService = require("../services/productService");
const productModel = require("../models/productModel");
const categoryModel = require("../models/categoryModel");
const pool = require("../config/db");

describe("product creation", () => {
  let client;

  beforeEach(() => {
    client = {
      query: jest.fn().mockResolvedValue({}),
      release: jest.fn(),
    };

    jest.spyOn(pool, "connect").mockResolvedValue(client);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("createProduct rejects non product managers", async () => {
    await expect(
      productService.createProduct({
        payload: { name: "Test" },
        userRole: "customer",
      })
    ).rejects.toThrow(/product managers/i);
  });

  test("createProduct forces prices to zero and normalizes images", async () => {
    jest
      .spyOn(categoryModel, "getCategoryById")
      .mockResolvedValue({
        categoryId: "cat-1",
        categoryName: "Test",
        isActive: true,
      });

    const createSpy = jest
      .spyOn(productModel, "createProduct")
      .mockResolvedValue({ productId: "prod-1" });
    const imageSpy = jest
      .spyOn(productModel, "createProductImages")
      .mockResolvedValue([]);
    jest
      .spyOn(productModel, "getProductDetailsByIdForManager")
      .mockResolvedValue({ productId: "prod-1" });

    const payload = {
      categoryId: "cat-1",
      name: "Eco Camper Van",
      model: "ECO-2025",
      serialNumber: "SN-000002",
      description: "Product description",
      quantityInStocks: 10,
      warrantyStatus: "4 Years",
      distributorInfo: "Distributor name",
      berthCount: 2,
      fuelType: "Diesel",
      weightKg: 1500,
      hasKitchen: false,
      basePrice: 999,
      currentPrice: 888,
      discountRate: 10,
      images: [
        { url: "https://example.com/front.jpg" },
        { url: "https://example.com/interior.jpg" },
      ],
    };

    const result = await productService.createProduct({
      payload,
      userRole: "product_manager",
    });

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        basePrice: 0,
        currentPrice: 0,
        discountRate: 0,
        isActive: false,
      }),
      client
    );

    expect(imageSpy).toHaveBeenCalledWith(
      {
        productId: "prod-1",
        images: [
          { url: "https://example.com/front.jpg", isPrimary: true },
          { url: "https://example.com/interior.jpg", isPrimary: false },
        ],
      },
      client
    );

    expect(result).toMatchObject({
      message: "Product created successfully",
      product: { productId: "prod-1" },
    });
  });
});
