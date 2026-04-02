import React from 'react';
import { useCart } from '../context/CartContext';



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
  const { cart, addToCart, updateQuantity, removeFromCart } = useCart();
  const isOutOfStock = product.quantityInStock === 0;

  const cartItem = cart.find(item => item.id === product.id);
  const currentQuantity = cartItem ? cartItem.cartQuantity : 0;

  const hasReachedMaxStock = currentQuantity >= product.quantityInStock;

  return (
    <div className="product-card">

<div className="image-container">
        <img 
          src={product.imageUrl} 
          alt={`${product.name} ${product.model}`} 
          className="product-image" 
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/default-caravan.jpg';
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
          {currentQuantity > 0 ? (
          <div className="active-cart-controls">
            <button 
              className="qty-btn"
              onClick={() => currentQuantity === 1 ? removeFromCart(product.id) : updateQuantity(product.id, currentQuantity - 1)}
            >
              -
            </button>
            
            <span className="qty-display">{currentQuantity} in Cart</span>
            
            <button 
              className="qty-btn"
              disabled={hasReachedMaxStock}
              onClick={() => updateQuantity(product.id, currentQuantity + 1)}
            >
              +
            </button>
          </div>
        ) : (
          <button 
            className="add-to-cart-btn" 
            disabled={isOutOfStock}
            onClick={() => addToCart(product)}
          >
            {isOutOfStock ? 'Unavailable' : 'Add to Cart'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;