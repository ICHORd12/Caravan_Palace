class Product {
  constructor({ id, name, price, description = '', category = '', stock = 0 }) {
    if (!id) throw new Error('Product id is required');
    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw new Error('Product name is required and must be a non-empty string');
    }
    if (typeof price !== 'number' || price < 0) {
      throw new Error('Product price must be a non-negative number');
    }
    if (typeof stock !== 'number' || stock < 0 || !Number.isInteger(stock)) {
      throw new Error('Product stock must be a non-negative integer');
    }

    this.id = id;
    this.name = name.trim();
    this.price = price;
    this.description = description;
    this.category = category;
    this.stock = stock;
  }

  isInStock() {
    return this.stock > 0;
  }

  applyDiscount(percentage) {
    if (typeof percentage !== 'number' || percentage < 0 || percentage > 100) {
      throw new Error('Discount must be a number between 0 and 100');
    }
    this.price = parseFloat((this.price * (1 - percentage / 100)).toFixed(2));
    return this.price;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      price: this.price,
      description: this.description,
      category: this.category,
      stock: this.stock,
    };
  }
}

export default Product;
