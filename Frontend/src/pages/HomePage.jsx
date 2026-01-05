import { getCookie } from '../utils/cookies.js';

const HomePage = () => {
  const username = getCookie('dk24_username')

  return (
    <div className="overlay">
      <h1>Hello {username}</h1>
    </div>
  )
}
export default HomePage;