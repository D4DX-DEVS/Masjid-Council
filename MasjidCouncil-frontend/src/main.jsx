// Self-hosted so Malayalam text never depends on the Google Fonts CDN loading.
import '@fontsource/noto-sans-malayalam/400.css';
import '@fontsource/noto-sans-malayalam/500.css';
import '@fontsource/noto-sans-malayalam/600.css';
import '@fontsource/noto-sans-malayalam/700.css';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
