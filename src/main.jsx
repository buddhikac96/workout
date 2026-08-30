import React from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.jsx'
import './styles.css'

registerSW({ immediate: true })

// Ask the browser to protect IndexedDB from storage-pressure eviction.
// Granted automatically on Android Chrome once the PWA is installed.
navigator.storage?.persist?.()

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
