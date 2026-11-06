import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './app/styles/themes.css'
import './app/styles/index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
