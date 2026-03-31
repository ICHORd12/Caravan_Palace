import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CartItem } from '../App'

interface Props {
  cart: CartItem[]
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>
}

const products = [
  { id: 1, category: 'Touring Caravans', name: 'Swift Sprite Major 4SB', price: 18999, desc: 'Family-friendly 4-berth tourer with fixed island bed.', emoji: '🚌', stock: 3 },
  { id: 2, category: 'Touring Caravans', name: 'Bailey Pegasus GT75', price: 24500, desc: 'Lightweight construction, premium interior finish.', emoji: '🚌', stock: 5 },
  { id: 3, category: 'Touring Caravans', name: 'Elddis Avante 868', price: 21300, desc: 'Spacious 8-berth layout, ideal for large families.', emoji: '🚌', stock: 2 },
  { id: 4, category: 'Static Caravans', name: 'Willerby Linwood 36ft', price: 32000, desc: 'Modern static with open-plan kitchen and lounge.', emoji: '🏠', stock: 4 },
  { id: 5, category: 'Static Caravans', name: 'ABI Beaumont Lodge', price: 41500, desc: 'Luxury lodge-style static, double glazed throughout.', emoji: '🏠', stock: 1 },
  { id: 6, category: 'Static Caravans', name: 'Carnaby Cheshire 38ft', price: 37800, desc: 'Panoramic windows, wrap-around decking included.', emoji: '🏠', stock: 2 },
  { id: 7, category: 'Accessories', name: 'Caravan Motor Mover', price: 899, desc: 'Fully automatic remote-controlled motor mover.', emoji: '⚙️', stock: 12 },
  { id: 8, category: 'Accessories', name: 'Awning Pro 450', price: 549, desc: 'All-weather inflatable awning, fits most tourers.', emoji: '⛺', stock: 8 },
  { id: 9, category: 'Accessories', name: 'Solar Panel Kit 200W', price: 349, desc: 'Complete solar kit with controller and cables.', emoji: '☀️', stock: 15 },
  { id: 10, category: 'Camping Gear', name: 'Folding Camping Table Set', price: 129, desc: 'Aluminium table with 4 chairs, carry bag included.', emoji: '🪑', stock: 20 },
  { id: 11, category: 'Camping Gear', name: 'Portable Gas BBQ', price: 189, desc: 'Compact stainless steel BBQ, fits in any storage bay.', emoji: '🍖', stock: 9 },
  { id: 12, category: 'Camping Gear', name: 'LED Camping Lantern', price: 49, desc: 'Rechargeable lantern, 360° illumination, 40hr battery.', emoji: '🔦', stock: 30 },
]

const categories = ['All', ...new Set(products.map(p => p.category))]

export default function Home({ cart, setCart }: Props) {
  const [activeCategory, setActiveCategory] = useState('All')
  const [addedId, setAddedId] = useState(null)
  const navigate = useNavigate()

  const filtered = activeCategory === 'All'
    ? products
    : products.filter(p => p.category === activeCategory)

  const getCartQty = (id) => {
    const item = cart.find(i => i.id === id)
    return item ? item.qty : 0
  }

  const addToCart = (product) => {
    const inCart = getCartQty(product.id)
    if (inCart >= product.stock) return
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { ...product, qty: 1 }]
    })
    setAddedId(product.id)
    setTimeout(() => setAddedId(null), 1000)
  }

  const totalItems = cart.reduce((sum, i) => sum + i.qty, 0)

  return (
    <div style={s.page}>

      {/* Navbar */}
      <nav style={s.nav}>
        <div style={s.navBrand}>🚐 CaravanCo</div>
        <div style={s.navRight}>
          <button style={s.loginBtn} onClick={() => navigate('/login')}>
            Sign in
          </button>
          <button style={s.cartBtn} onClick={() => navigate('/cart')}>
            🛒 Cart {totalItems > 0 && <span style={s.badge}>{totalItems}</span>}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={s.hero}>
        <h1 style={s.heroTitle}>Find your perfect home on wheels</h1>
        <p style={s.heroSub}>Browse our collection of caravans and camping gear</p>
      </div>

      {/* Category filters */}
      <div style={s.filters}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{ ...s.filterBtn, ...(activeCategory === cat ? s.filterBtnActive : {}) }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product grid */}
      <div style={s.grid}>
        {filtered.map(product => {
          const inCart = getCartQty(product.id)
          const outOfStock = product.stock === 0
          const maxReached = inCart >= product.stock
          const isAdded = addedId === product.id

          return (
            <div key={product.id} style={{
              ...s.card,
              ...(outOfStock ? s.cardDisabled : {})
            }}>
              <div style={s.cardEmoji}>{product.emoji}</div>
              <div style={s.cardCategory}>{product.category}</div>
              <h3 style={s.cardName}>{product.name}</h3>
              <p style={s.cardDesc}>{product.desc}</p>

              {/* Stock indicator */}
              <div style={s.stockRow}>
                <span style={{
                  ...s.stockBadge,
                  ...(outOfStock ? s.stockOut : product.stock <= 3 ? s.stockLow : s.stockOk)
                }}>
                  {outOfStock ? 'Out of stock' : product.stock <= 3 ? `⚠ Only ${product.stock} left` : `✓ In stock (${product.stock})`}
                </span>
                {inCart > 0 && (
                  <span style={s.inCartBadge}>{inCart} in cart</span>
                )}
              </div>

              <div style={s.cardFooter}>
                <span style={s.cardPrice}>£{product.price.toLocaleString()}</span>
                <button
                  style={{
                    ...s.addBtn,
                    ...(isAdded ? s.addBtnSuccess : {}),
                    ...(maxReached || outOfStock ? s.addBtnDisabled : {})
                  }}
                  onClick={() => addToCart(product)}
                  disabled={maxReached || outOfStock}
                >
                  {outOfStock ? 'Out of stock' : maxReached ? 'Max reached' : isAdded ? '✓ Added' : '+ Add to cart'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}

const s = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#0a0a1a',
    color: '#fff',
    fontFamily: "'Georgia', serif",
  },
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 40px',
    backgroundColor: 'rgba(10,10,26,0.95)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  navBrand: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#fef3c7',
    letterSpacing: '0.5px',
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  loginBtn: {
    padding: '10px 20px',
    backgroundColor: 'transparent',
    color: '#d4a96a',
    border: '1px solid rgba(212,169,106,0.4)',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: "'Georgia', serif",
  },
  cartBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    backgroundColor: '#e74c3c',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  badge: {
    backgroundColor: '#fef3c7',
    color: '#c0392b',
    borderRadius: '999px',
    padding: '1px 7px',
    fontSize: '12px',
    fontWeight: '700',
  },
  hero: {
    textAlign: 'center',
    padding: '60px 40px 40px',
    background: 'linear-gradient(to bottom, #0f3460, #0a0a1a)',
  },
  heroTitle: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#fef3c7',
    margin: '0 0 12px',
  },
  heroSub: {
    fontSize: '16px',
    color: '#a78bac',
    margin: 0,
  },
  filters: {
    display: 'flex',
    gap: '10px',
    padding: '24px 40px',
    flexWrap: 'wrap',
  },
  filterBtn: {
    padding: '8px 18px',
    borderRadius: '999px',
    border: '1px solid rgba(255,255,255,0.15)',
    backgroundColor: 'transparent',
    color: '#aaa',
    fontSize: '14px',
    cursor: 'pointer',
    fontFamily: "'Georgia', serif",
  },
  filterBtnActive: {
    backgroundColor: '#e74c3c',
    borderColor: '#e74c3c',
    color: '#fff',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '24px',
    padding: '0 40px 60px',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  cardDisabled: {
    opacity: 0.5,
  },
  cardEmoji: {
    fontSize: '36px',
    marginBottom: '4px',
  },
  cardCategory: {
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: '#d4a96a',
    fontWeight: '600',
  },
  cardName: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#fef3c7',
    margin: 0,
  },
  cardDesc: {
    fontSize: '13px',
    color: '#888',
    margin: 0,
    lineHeight: '1.6',
    flex: 1,
  },
  stockRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  stockBadge: {
    fontSize: '11px',
    fontWeight: '600',
    padding: '3px 8px',
    borderRadius: '999px',
  },
  stockOk: {
    backgroundColor: 'rgba(39,174,96,0.15)',
    color: '#2ecc71',
  },
  stockLow: {
    backgroundColor: 'rgba(230,126,34,0.15)',
    color: '#e67e22',
  },
  stockOut: {
    backgroundColor: 'rgba(231,76,60,0.15)',
    color: '#e74c3c',
  },
  inCartBadge: {
    fontSize: '11px',
    fontWeight: '600',
    padding: '3px 8px',
    borderRadius: '999px',
    backgroundColor: 'rgba(212,169,106,0.15)',
    color: '#d4a96a',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '12px',
  },
  cardPrice: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#fff',
  },
  addBtn: {
    padding: '8px 14px',
    backgroundColor: '#e74c3c',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  addBtnSuccess: {
    backgroundColor: '#27ae60',
  },
  addBtnDisabled: {
    backgroundColor: '#444',
    color: '#888',
    cursor: 'not-allowed',
  },
}