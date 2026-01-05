import Antigravity from './Antigravity.jsx';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCookie, setCookie } from '../utils/cookies.js';


const LoginPage = () => {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')

  useEffect(() => {
    const existing = getCookie('dk24_username')
    if (existing) navigate('/', { replace: true })
  }, [navigate])

  const onSubmit = e => {
    e.preventDefault()

    const trimmed = username.trim()
    if (!trimmed) return

    setCookie('dk24_username', trimmed, { days: 30 })
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
        <form className="loginForm" onSubmit={onSubmit}>
          <h1>Welcome to DK24 Form</h1>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Username"
            aria-label="Username"
            autoComplete="username"
          />
          <button type="submit">Submit</button>
        </form>
      </div>
    </div>
  )
}

export default LoginPage;