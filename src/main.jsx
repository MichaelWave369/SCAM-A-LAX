import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './AppV3.jsx'
import './styles.css'
import './intelligence.css'
import './intake.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
