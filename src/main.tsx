import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// Global styles applied to body and root
const globalStyles = `
  * {
    box-sizing: border-box;
  }

  .pace-calculator-app input:focus {
    outline: none;
    border-color: #646cff !important;
  }

  @media (max-width: 640px) {
    .pace-calculator-app {
      padding: 1rem !important;
    }

    .pace-calculator-app .mode-toggle-mobile {
      flex-direction: column !important;
      gap: 4px !important;
    }
    
    .pace-calculator-app .mode-button-mobile {
      white-space: normal !important;
      text-align: center !important;
      padding: 12px 16px !important;
    }
    
    .pace-calculator-app .row-mobile {
      grid-template-columns: 1fr !important;
      gap: 20px !important;
    }
  }
`

// Add viewport meta tag for proper mobile rendering
if (!document.querySelector('meta[name="viewport"]')) {
  const viewportMeta = document.createElement('meta')
  viewportMeta.name = 'viewport'
  viewportMeta.content = 'width=device-width, initial-scale=1.0'
  document.head.appendChild(viewportMeta)
}

// Inject global styles
const styleElement = document.createElement('style')
styleElement.textContent = globalStyles
document.head.appendChild(styleElement)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
