import './App.css';
import ProductCard, { type CaravanProduct } from './components/ProductCard';
import { useCaravans } from './hooks/useCaravans';
import { useCategories } from './hooks/useCategories';





function App() {

  const { caravans, isLoading: caravansLoading, error: caravansError } = useCaravans();
  const { categories, isLoading: categoriesLoading, error: categoriesError } = useCategories();


  return (
    <div className="app-container">
      
      {/* Navigation Bar */}
      <nav className="navbar">
        <h1><i>Caravan-Palace</i></h1>
        <div className="nav-links">
          <input type="text" placeholder="Search models or descriptions..." />
          <button>Login</button>
          <button>Cart (0)</button>
        </div>
      </nav>

      <div className="marquee-container">
        <div className="marquee-text">
          Grand Opening • Free delivery on all orders over $50k! • Warranty included on all new models! 
        </div>
      </div>

      {/* Main Content Area */}
      <main className="main-content">
        
        {/* Categories Sidebar */}
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
        
        {/* Product Grid */}
        <section className="product-grid">
          {caravansLoading && <h2>Loading caravan inventory...</h2>}
          {caravansError && <h2 style={{ color: '#e74c3c' }}>{caravansError}</h2>}
          
          {!caravansLoading && !caravansError && caravans.map(caravan => (
            <ProductCard key={caravan.id} product={caravan} />
          ))}
        </section>

      </main>

    </div>
  );
}

export default App;