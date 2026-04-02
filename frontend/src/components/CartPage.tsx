import React from 'react';
import { useCart } from '../context/CartContext';

const CartPage: React.FC = () => {
  const { cart, removeFromCart, updateQuantity, totalPrice } = useCart();

  if (cart.length === 0) {
    return <div className="cart-empty">Your cart is currently empty.</div>;
  }

  return (
    <div className="cart-page">
      <h2>Your Shopping Cart</h2>
      <div className="cart-items">
        {cart.map((item) => (
          <div key={item.id} className="cart-item-row" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <img src={item.imageUrl} alt={item.name} width="100" />
            <div>
              <h4>{item.name}</h4>
              <p>${item.price.toLocaleString()}</p>
              
              <div className="quantity-controls">
                <button onClick={() => updateQuantity(item.id, item.cartQuantity - 1)}>-</button>
                <span style={{ margin: '0 10px' }}>{item.cartQuantity}</span>
                <button onClick={() => updateQuantity(item.id, item.cartQuantity + 1)}>+</button>
              </div>

              <button 
                onClick={() => removeFromCart(item.id)} 
                style={{ color: 'red', marginTop: '0.5rem' }}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="cart-summary" style={{ marginTop: '2rem', borderTop: '1px solid #ccc', paddingTop: '1rem' }}>
        <h3>Total: ${totalPrice.toLocaleString()}</h3>
        <button className="checkout-btn">Proceed to Checkout</button>
      </div>
    </div>
  );
};

export default CartPage;