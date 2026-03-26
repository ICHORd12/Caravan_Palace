import { describe, test, expect } from '@jest/globals';
import Product from '../models/Product.js';

describe('Product Model', () => {
  const validProps = {
    id: 1,
    name: 'Vintage Lamp',
    price: 49.99,
    description: 'A beautiful vintage lamp',
    category: 'Lighting',
    stock: 10,
  };

  // Test 1: Creating a valid product
  test('should create a product with valid properties', () => {
    const product = new Product(validProps);

    expect(product.id).toBe(1);
    expect(product.name).toBe('Vintage Lamp');
    expect(product.price).toBe(49.99);
    expect(product.description).toBe('A beautiful vintage lamp');
    expect(product.category).toBe('Lighting');
    expect(product.stock).toBe(10);
  });

  // Test 2: Validation — reject missing or invalid name
  test('should throw an error when name is missing or empty', () => {
    expect(() => new Product({ ...validProps, name: '' })).toThrow(
      'Product name is required'
    );
    expect(() => new Product({ ...validProps, name: '   ' })).toThrow(
      'Product name is required'
    );
    expect(() => new Product({ ...validProps, name: 123 })).toThrow(
      'Product name is required'
    );
  });

  // Test 3: Validation — reject negative price
  test('should throw an error when price is negative', () => {
    expect(() => new Product({ ...validProps, price: -5 })).toThrow(
      'Product price must be a non-negative number'
    );
    expect(() => new Product({ ...validProps, price: 'free' })).toThrow(
      'Product price must be a non-negative number'
    );
  });

  // Test 4: isInStock method
  test('isInStock should return true when stock > 0 and false when stock is 0', () => {
    const inStock = new Product(validProps);
    expect(inStock.isInStock()).toBe(true);

    const outOfStock = new Product({ ...validProps, stock: 0 });
    expect(outOfStock.isInStock()).toBe(false);
  });

  // Test 5: applyDiscount method
  test('applyDiscount should correctly reduce the price', () => {
    const product = new Product({ ...validProps, price: 100 });

    const newPrice = product.applyDiscount(25);
    expect(newPrice).toBe(75);
    expect(product.price).toBe(75);

    // Invalid discount should throw
    expect(() => product.applyDiscount(150)).toThrow(
      'Discount must be a number between 0 and 100'
    );
    expect(() => product.applyDiscount(-10)).toThrow(
      'Discount must be a number between 0 and 100'
    );
  });
});
