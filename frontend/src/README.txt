assets: Some fonts and images after merge we can handle

components: Site Components are here (ex: ProductCard)

context: currently holding the Carting and Caching Logic

hooks: Allows fetching to components from SB

services:allows acess to supabase. I could not link directly to backend API got many backend errors. this is placeholder now

For Modular Migration Follow these -----

For the cart memory to work, the entire app needs to be wrapped in the CartProvider. 
Go to `src/main.tsx` and wrap the <App /> component:

import { CartProvider } from './context/CartContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CartProvider> 
      <App />
    </CartProvider>
  </StrictMode>,
)


Use the custom hook to grab the database data, then map it to the ProductCards. The card already handles the "Add to Cart" and "+/-" UI logic internally!

import ProductCard from './components/ProductCard';
import { useCaravans } from './hooks/useCaravans';

function YourStorefrontComponent() {
  const { caravans, isLoading, error } = useCaravans();

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="your-grid-class">
      {caravans.map(caravan => (
        <ProductCard key={caravan.id} product={caravan} />
      ))}
    </div>
  );
}

The CartPage is 100% modular. It automatically reads the cached data and calculates the totals. Just drop it wherever your design routes the user when they click "View Cart".

import CartPage from './components/CartPage';

function YourCartRoute() {
  return <CartPage />;
}

If you want to show a little number next to the shopping cart icon in your Navbar, you can pull the cart data from anywhere using the hook:

import { useCart } from './context/CartContext';

function Navbar() {
  const { cart } = useCart();
  const totalItems = cart.reduce((sum, item) => sum + item.cartQuantity, 0);

  return <button>Cart ({totalItems})</button>;
}

