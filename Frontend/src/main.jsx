import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const Root = () => {
  return <h1>Webpage under Development,Stay Tuned! </h1>;
};
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root/>
  </StrictMode>,
)
