import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// Embed-specific global styles
const embedStyles = `
  * {
    box-sizing: border-box;
  }

  #root {
    margin-top: -100px;
  }

  /* Override Squarespace mobile gutters while keeping content visible */
  @media (max-width: 768px) {
    .pace-calculator-app {
      margin-left: calc(-1 * var(--sqs-mobile-site-gutter, 6vw)) !important;
      margin-right: calc(-1 * var(--sqs-mobile-site-gutter, 6vw)) !important;
      padding-left: var(--sqs-mobile-site-gutter, 6vw) !important;
      padding-right: var(--sqs-mobile-site-gutter, 6vw) !important;
      width: 100vw !important;
      max-width: none !important;
      position: relative;
      left: 50%;
      right: 50%;
      margin-left: -50vw !important;
      margin-right: -50vw !important;
    }
  }

  .pace-calculator-app input:focus {
    outline: none;
    border-color: #646cff !important;
  }

  @media (max-width: 640px) {
    .pace-calculator-app {
      padding: 1rem var(--sqs-mobile-site-gutter, 6vw) !important;
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

  @media (max-width: 642px) {
    #root {
      margin-top: -60px
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

// Inject embed-specific styles
const styleElement = document.createElement('style')
styleElement.textContent = embedStyles
document.head.appendChild(styleElement)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
