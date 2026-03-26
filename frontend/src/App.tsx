import './App.css';
import ProductCard, { type CaravanProduct } from './components/ProductCard';
import { useCaravans } from './hooks/useCaravans';





function App() {

  const { caravans, isLoading, error } = useCaravans();


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
          Grand Opening Sale: Save 15% on all Class B Camper Vans this week! • Free delivery on all orders over $50k! • Warranty included on all new models! 
        </div>
      </div>

      {/* Main Content Area */}
      <main className="main-content">
        
        {/* Categories Sidebar */}
        <aside className="sidebar">
          <h3>Categories</h3>
          <ul>
            <li>Class A Motorhomes</li>
            <li>Class B Camper Vans</li>
            <li>Travel Trailers</li>
            <li>Fifth Wheels</li>
          </ul>
        </aside>
        
        {/* Product Grid Placeholder */}
        <section className="product-grid">
          
          {/* 1. Show a loading message while waiting for Supabase */}
          {isLoading && <h2>Loading caravan inventory...</h2>}
          
          {/* 2. Show a red error message if the fetch fails */}
          {error && <h2 style={{ color: '#e74c3c' }}>{error}</h2>}
          
          {/* 3. Only map over the caravans if we are done loading and have no errors */}
          {!isLoading && !error && caravans.map(caravan => (
            <ProductCard key={caravan.id} product={caravan} />
          ))}

        </section>
  

      </main>

    </div>
  );
}

export default App;