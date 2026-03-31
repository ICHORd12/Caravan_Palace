import { useNavigate } from 'react-router-dom'
import type { CartItem } from '../App'

interface Props {
  cart: CartItem[]
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>
}

export default function Cart({ cart, setCart }: Props) {
  const navigate = useNavigate()

  const updateQty = (id, delta) => {
    setCart(prev => prev
      .map(i => {
        if (i.id !== id) return i
        const newQty = i.qty + delta
        if (newQty > i.stock) return i
        return { ...i, qty: newQty }
      })
      .filter(i => i.qty > 0)
    )
  }

  const removeItem = (id) => {
    setCart(prev => prev.filter(i => i.id !== id))
  }

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0)

  if (cart.length === 0) {
    return (
      <div style={s.page}>
        <nav style={s.nav}>
          <button style={s.backBtn} onClick={() => navigate('/')}>← Back to shop</button>
          <div style={s.navBrand}>🚐 CaravanCo</div>
        </nav>
        <div style={s.empty}>
          <div style={s.emptyIcon}>🛒</div>
          <h2 style={s.emptyTitle}>Your cart is empty</h2>
          <p style={s.emptySub}>Looks like you haven't added anything yet.</p>
          <button style={s.shopBtn} onClick={() => navigate('/')}>Browse products</button>
        </div>
      </div>
    )
  }

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <button style={s.backBtn} onClick={() => navigate('/')}>← Back to shop</button>
        <div style={s.navBrand}>🚐 CaravanCo</div>
      </nav>

      <div style={s.content}>
        <h1 style={s.title}>Your Cart</h1>

        <div style={s.layout}>
          {/* Items */}
          <div style={s.items}>
            {cart.map(item => (
              <div key={item.id} style={s.item}>
                <div style={s.itemEmoji}>{item.emoji}</div>
                <div style={s.itemInfo}>
                  <div style={s.itemCategory}>{item.category}</div>
                  <div style={s.itemName}>{item.name}</div>
                  <div style={s.itemPrice}>£{(item.price * item.qty).toLocaleString()}</div>
                  <div style={s.itemStock}>Stock: {item.stock}</div>
                </div>
                <div style={s.itemControls}>
                  <button style={s.qtyBtn} onClick={() => updateQty(item.id, -1)}>−</button>
                  <span style={s.qty}>{item.qty}</span>
                  <button
                    style={{
                      ...s.qtyBtn,
                      ...(item.qty >= item.stock ? s.qtyBtnDisabled : {})
                    }}
                    onClick={() => updateQty(item.id, 1)}
                    disabled={item.qty >= item.stock}
                  >
                    +
                  </button>
                  <button style={s.removeBtn} onClick={() => removeItem(item.id)}>🗑</button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div style={s.summary}>
            <h2 style={s.summaryTitle}>Order Summary</h2>
            <div style={s.summaryRows}>
              {cart.map(item => (
                <div key={item.id} style={s.summaryRow}>
                  <span style={s.summaryName}>{item.name} × {item.qty}</span>
                  <span style={s.summaryPrice}>£{(item.price * item.qty).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div style={s.divider} />
            <div style={s.totalRow}>
              <span style={s.totalLabel}>Total</span>
              <span style={s.totalPrice}>£{total.toLocaleString()}</span>
            </div>
            <button style={s.checkoutBtn} onClick={() => navigate('/login')}>
              Proceed to Checkout →
            </button>
          </div>
        </div>
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
  },
  backBtn: {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    color: '#d4a96a',
    border: '1px solid rgba(212,169,106,0.3)',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    fontFamily: "'Georgia', serif",
  },
  content: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '40px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#fef3c7',
    marginBottom: '32px',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '1fr 340px',
    gap: '32px',
    alignItems: 'start',
  },
  items: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    backgroundColor: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    padding: '20px',
  },
  itemEmoji: {
    fontSize: '32px',
    minWidth: '48px',
    textAlign: 'center',
  },
  itemInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  itemCategory: {
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: '#d4a96a',
  },
  itemName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#fef3c7',
  },
  itemPrice: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#fff',
  },
  itemStock: {
    fontSize: '12px',
    color: '#888',
  },
  itemControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  qtyBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.15)',
    backgroundColor: 'transparent',
    color: '#fff',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnDisabled: {
    opacity: 0.3,
    cursor: 'not-allowed',
  },
  qty: {
    minWidth: '24px',
    textAlign: 'center',
    fontSize: '16px',
    fontWeight: '600',
  },
  removeBtn: {
    marginLeft: '8px',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
  },
  summary: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    padding: '24px',
    position: 'sticky',
    top: '80px',
  },
  summaryTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#fef3c7',
    marginBottom: '16px',
  },
  summaryRows: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#aaa',
  },
  summaryName: {
    flex: 1,
    marginRight: '12px',
  },
  summaryPrice: {
    fontWeight: '600',
    color: '#fff',
  },
  divider: {
    borderTop: '1px solid rgba(255,255,255,0.08)',
    margin: '16px 0',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  totalLabel: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#fef3c7',
  },
  totalPrice: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#fff',
  },
  checkoutBtn: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#e74c3c',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: "'Georgia', serif",
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: '12px',
  },
  emptyIcon: { fontSize: '64px' },
  emptyTitle: { fontSize: '24px', fontWeight: '700', color: '#fef3c7' },
  emptySub: { fontSize: '14px', color: '#888' },
  shopBtn: {
    marginTop: '8px',
    padding: '12px 24px',
    backgroundColor: '#e74c3c',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: "'Georgia', serif",
  },
}