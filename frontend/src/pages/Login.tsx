import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Login() {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const navigate = useNavigate()
  
  const handleSubmit = (e) => {
    e.preventDefault()
    // TODO: replace this with real Django API call later
    navigate('/checkout')
  }

  return (
    <div style={styles.page}>
      {/* Background stars */}
      {[...Array(60)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: i % 3 === 0 ? '2px' : '1px',
          height: i % 3 === 0 ? '2px' : '1px',
          backgroundColor: 'rgba(255,255,255,0.6)',
          borderRadius: '50%',
          top: `${Math.sin(i * 137.5) * 50 + 50}%`,
          left: `${Math.cos(i * 137.5) * 50 + 50}%`,
        }} />
      ))}

      {/* Moon */}
      <div style={styles.moon} />

      {/* Mountains */}
      <svg style={styles.mountains} viewBox="0 0 1440 320" preserveAspectRatio="none">
        <polygon points="0,320 200,120 400,320" fill="#1a1a2e" />
        <polygon points="150,320 420,80 690,320" fill="#16213e" />
        <polygon points="400,320 650,140 900,320" fill="#1a1a2e" />
        <polygon points="700,320 950,100 1200,320" fill="#16213e" />
        <polygon points="1000,320 1220,150 1440,320" fill="#1a1a2e" />
        <polygon points="1100,320 1350,60 1600,320" fill="#0f3460" opacity="0.7" />
      </svg>

      {/* Caravan SVG */}
      <svg style={styles.caravan} viewBox="0 0 260 100">
        {/* Body */}
        <rect x="10" y="20" width="200" height="65" rx="10" fill="#c0392b" />
        {/* Roof rack */}
        <rect x="15" y="15" width="190" height="8" rx="3" fill="#922b21" />
        {/* Window 1 */}
        <rect x="30" y="33" width="40" height="28" rx="4" fill="#85c1e9" opacity="0.85" />
        <line x1="50" y1="33" x2="50" y2="61" stroke="#5dade2" strokeWidth="1.5" />
        <line x1="30" y1="47" x2="70" y2="47" stroke="#5dade2" strokeWidth="1.5" />
        {/* Window 2 */}
        <rect x="85" y="33" width="40" height="28" rx="4" fill="#85c1e9" opacity="0.85" />
        <line x1="105" y1="33" x2="105" y2="61" stroke="#5dade2" strokeWidth="1.5" />
        <line x1="85" y1="47" x2="125" y2="47" stroke="#5dade2" strokeWidth="1.5" />
        {/* Door */}
        <rect x="148" y="38" width="30" height="47" rx="3" fill="#922b21" />
        <circle cx="172" cy="62" r="2.5" fill="#f0b27a" />
        {/* Stripe */}
        <rect x="10" y="58" width="200" height="8" rx="0" fill="#e74c3c" opacity="0.5" />
        {/* Wheels */}
        <circle cx="55" cy="88" r="13" fill="#2c3e50" />
        <circle cx="55" cy="88" r="7" fill="#7f8c8d" />
        <circle cx="55" cy="88" r="3" fill="#bdc3c7" />
        <circle cx="170" cy="88" r="13" fill="#2c3e50" />
        <circle cx="170" cy="88" r="7" fill="#7f8c8d" />
        <circle cx="170" cy="88" r="3" fill="#bdc3c7" />
        {/* Hitch */}
        <rect x="205" y="72" width="40" height="5" rx="2" fill="#7f8c8d" />
        <circle cx="248" cy="74" r="4" fill="#95a5a6" />
        {/* Chimney smoke */}
        <circle cx="100" cy="10" r="4" fill="rgba(255,255,255,0.15)" />
        <circle cx="104" cy="4" r="3" fill="rgba(255,255,255,0.1)" />
        <rect x="97" y="10" width="6" height="8" rx="1" fill="#7f8c8d" />
      </svg>

      {/* Ground -->*/}
      <div style={styles.ground} />

      {/* Login Card */}
      <div style={styles.card}>
        <div style={styles.campfireIcon}>🔥</div>
        <h1 style={styles.title}>Welcome back</h1>
        <p style={styles.subtitle}>Sign in to continue your journey</p>

        <div style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />
          </div>

          <button onClick={handleSubmit} style={styles.button}
            onMouseEnter={e => e.target.style.backgroundColor = '#c0392b'}
            onMouseLeave={e => e.target.style.backgroundColor = '#e74c3c'}
          >
            Hit the road →
          </button>
        </div>

        <p style={styles.footer}>
          New traveller?{' '}
          <a href="#" style={styles.link}>Create an account</a>
        </p>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(to bottom, #0a0a1a 0%, #0f3460 60%, #1a1a2e 100%)',
    fontFamily: "'Georgia', serif",
    overflow: 'hidden',
    position: 'relative',
  },
  moon: {
    position: 'absolute',
    top: '8%',
    right: '12%',
    width: '70px',
    height: '70px',
    borderRadius: '50%',
    backgroundColor: '#fef9c3',
    boxShadow: '0 0 40px rgba(254,249,195,0.4), 0 0 80px rgba(254,249,195,0.15)',
  },
  mountains: {
    position: 'absolute',
    bottom: '80px',
    left: 0,
    width: '100%',
    height: '220px',
  },
  caravan: {
    position: 'absolute',
    bottom: '118px',
    right: '8%',
    width: '220px',
  },
  ground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '90px',
    backgroundColor: '#0d1b0d',
    borderTop: '2px solid #1a3a1a',
  },
  card: {
    position: 'relative',
    zIndex: 10,
    backgroundColor: 'rgba(15, 20, 15, 0.82)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.08)',
    padding: '40px',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '380px',
    boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
    color: '#fff',
  },
  campfireIcon: {
    fontSize: '32px',
    marginBottom: '12px',
    display: 'block',
  },
  title: {
    margin: '0 0 4px 0',
    fontSize: '26px',
    fontWeight: '700',
    color: '#fef3c7',
    letterSpacing: '0.3px',
  },
  subtitle: {
    margin: '0 0 28px 0',
    color: '#a78bac',
    fontSize: '14px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#d4a96a',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
  input: {
    padding: '11px 14px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
  },
  button: {
    marginTop: '8px',
    padding: '13px',
    backgroundColor: '#e74c3c',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    letterSpacing: '0.3px',
    transition: 'background-color 0.2s',
  },
  footer: {
    marginTop: '24px',
    textAlign: 'center',
    fontSize: '13px',
    color: '#8888aa',
  },
  link: {
    color: '#d4a96a',
    fontWeight: '600',
    textDecoration: 'none',
  },
}

export default Login