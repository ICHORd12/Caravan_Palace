import React from 'react';

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
  imageUrl: string;
  category: string; 
  averageRating: number;
  reviewCount: number;
  weightKg: number | null;
  hasKitchen: boolean | null;

}

interface ProductCardProps {
  product: CaravanProduct;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const isOutOfStock = product.quantityInStock === 0;

  return (
    <div className="product-card">

<div className="image-container">
        <img 
          src={product.imageUrl} 
          alt={`${product.name} ${product.model}`} 
          className="product-image" 
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Image+Not+Found';
          }}
        />
        
        {/* The Hover Overlay */}
        <div className="card-overlay">
          <h4>Quick Specs</h4>
          <ul>
            <li><strong>Warranty:</strong> {product.warrantyStatus || 'N/A'}</li>
            <li><strong>Distributor:</strong> {product.distributorInfo || 'N/A'}</li>
            <li><strong>Weight:</strong> {product.weightKg ? `${product.weightKg} kg` : 'N/A'}</li>
            <li><strong>Kitchen:</strong> {product.hasKitchen ? 'Included' : 'None'}</li>
          </ul>
        </div>
      </div>
   
      <div className="card-content">

        <span className="category-label">{product.category}</span>

        {/* Star Rating Display */}
        <div className="rating-container">
          <span className="stars">
            {'★'.repeat(Math.round(product.averageRating))}
            {'☆'.repeat(5 - Math.round(product.averageRating))}
          </span>
          <span className="review-count">({product.reviewCount})</span>
        </div>

        <h3>{product.name}</h3>
        <p className="model-text">Model: {product.model}</p>
        <p className="desc-text">{product.description}</p>

        <div className="card-details">
          <span className="price">${product.price.toLocaleString()}</span>
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