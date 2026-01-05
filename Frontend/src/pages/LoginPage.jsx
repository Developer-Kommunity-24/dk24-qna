import Antigravity from './Antigravity.jsx';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCookie, setCookie } from '../utils/cookies.js';


const LoginPage = () => {
  const navigate = useNavigate()
  const [showRules, setShowRules] = useState(false)

  useEffect(() => {
    const existing = getCookie('dk24_username')
    if (existing) navigate('/', { replace: true })
    else setShowRules(true)
  }, [navigate])

  const onSubmit = e => {
    e.preventDefault()
    setCookie('dk24_username', 'Anonymous', { days: 30 })
    navigate('/', { replace: true })
  }

  return (
    <div className="app">
      <Antigravity
        count={300}
        magnetRadius={6}
        ringRadius={7}
        waveSpeed={0.4}
        waveAmplitude={1}
        particleSize={1.5}
        lerpSpeed={0.05}
        color={'#FF9FFC'}
        autoAnimate={true}
        particleVariance={1}
      />
      <div className="overlay">
        {showRules && (
          <div className="rules-modal" style={{
            background: 'rgba(0,0,0,0.8)',
            padding: '2rem',
            borderRadius: '1rem',
            marginBottom: '1rem',
            maxWidth: '400px',
            textAlign: 'left',
            border: '1px solid #333'
          }}>
            <h2 style={{ marginTop: 0, color: '#FF9FFC' }}>Community Rules</h2>
            <ul style={{ paddingLeft: '1.2rem', lineHeight: '1.6' }}>
              <li>Be respectful to everyone.</li>
              <li>No explicit, hateful, or violent content.</li>
              <li>Help others and share knowledge.</li>
              <li>This is an anonymous platform, use it responsibly.</li>
            </ul>
          </div>
        )}
        <form className="loginForm" onSubmit={onSubmit}>
          <h1>Welcome to DK24</h1>
          <button type="submit">Get Started</button>
        </form>
      </div>
    </div>
  )
}

export default LoginPage;