import React from 'react';

// This strictly enforces Requirement #9 for your project grading
export interface CaravanProduct {
  id: string;
  name: string;
  model: string;
  serialNumber: string;
  description: string;
  quantityInStock: number;
  price: number;
  warrantyStatus: string;
  distributorInfo: string;
}

interface ProductCardProps {
  product: CaravanProduct;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  // Requirement #7: If out of stock, user shouldn't be able to add it to cart
  const isOutOfStock = product.quantityInStock === 0;

  return (
    <div className="product-card">
      {/* Placeholder for the caravan image */}
      <div className="card-image-placeholder">
        🚐 Image
      </div>
      
      <div className="card-content">
        <h3>{product.name}</h3>
        <p className="model-text">Model: {product.model}</p>
        <p className="desc-text">{product.description}</p>
        
        <div className="card-details">
          <span className="price">${product.price.toLocaleString()}</span>
          {/* Requirement #3: Must show quantity in stock */}
          <span className={`stock ${isOutOfStock ? 'out-of-stock' : 'in-stock'}`}>
            {isOutOfStock ? 'Out of Stock' : `${product.quantityInStock} left in stock`}
          </span>
        </div>

        <button 
          className="add-to-cart-btn" 
          disabled={isOutOfStock}
        >
          {isOutOfStock ? 'Unavailable' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;