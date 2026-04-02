import { useState } from 'react';
import './App.css';
import ProductCard from './components/ProductCard';
import CartPage from './components/CartPage'; // Import the new Cart Page
import { useCaravans } from './hooks/useCaravans';
import { useCategories } from './hooks/useCategories';
import { useCart } from './context/CartContext'; // Import the Cart logic


function App() {

  const { caravans, isLoading: caravansLoading, error: caravansError } = useCaravans();
  const { categories, isLoading: categoriesLoading, error: categoriesError } = useCategories();
  // 1. Pull the cart data from our modular provider
  const { cart } = useCart();
    
  const totalItems = cart.reduce((sum, item) => sum + item.cartQuantity, 0);

  const [isCartOpen, setIsCartOpen] = useState(false);


  return (
    <div className="app-container">
      
      <nav className="navbar">
        <h1>
          <a href="/" onClick={(e) => { e.preventDefault(); setIsCartOpen(false); }} className="logo-link">
            <i>Caravan-Palace</i>
          </a>
        </h1>
        <div className="nav-links">
          <input type="text" placeholder="Search models or descriptions..." />
          <button>Login</button>

          <button onClick={() => setIsCartOpen(true)}>
            Cart ({totalItems})
          </button>
        </div>
      </nav>
 

      <div className="marquee-container">
        <div className="marquee-text">
          Grand Opening • Free delivery on all orders over $50k! • Warranty included on all new models! 
        </div>
      </div>
      
      <main className="main-content">
        
        {isCartOpen ? (

          <CartPage />
        ) : (
          <>
            <aside className="sidebar">
              <h3>Categories</h3>
              {categoriesLoading && <p style={{color: '#888'}}>Loading...</p>}
              {categoriesError && <p style={{color: '#e74c3c'}}>{categoriesError}</p>}
              <ul>
                <li className="active-category">All Products</li>
                {!categoriesLoading && !categoriesError && categories.map(category => (
                  <li key={category.id}>{category.name}</li>
                ))}
              </ul>
            </aside>
            
            <section className="product-grid">
              {caravansLoading && <h2>Loading caravan inventory...</h2>}
              {caravansError && <h2 style={{ color: '#e74c3c' }}>{caravansError}</h2>}
              {!caravansLoading && !caravansError && caravans.map(caravan => (
                <ProductCard key={caravan.id} product={caravan} />
              ))}
            </section>
          </>
        )}

      </main>

 

    </div>
  );
}

export default App;