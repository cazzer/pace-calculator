import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// Global styles applied to body and root
const globalStyles = `
  :root {
    font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
    line-height: 1.5;
    font-weight: 400;
    color-scheme: light dark;
    color: rgba(255, 255, 255, 0.87);
    background-color: #242424;
    font-synthesis: none;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    -webkit-text-size-adjust: 100%;
    
    /* Dark mode colors */
    --text-primary: rgba(255, 255, 255, 0.95);
    --text-secondary: rgba(255, 255, 255, 0.7);
    --text-tertiary: rgba(255, 255, 255, 0.6);
    --text-muted: rgba(255, 255, 255, 0.5);
    --bg-card: rgba(255, 255, 255, 0.05);
    --bg-card-alt: rgba(255, 255, 255, 0.03);
    --bg-secondary: rgba(255, 255, 255, 0.08);
    --border-color: rgba(255, 255, 255, 0.1);
    --border-table: rgba(255, 255, 255, 0.2);
    --button-bg: transparent;
    --button-bg-active: rgba(255, 255, 255, 0.15);
    --button-text: rgba(255, 255, 255, 0.8);
    --button-text-active: rgba(255, 255, 255, 0.95);
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    display: flex;
    place-items: center;
    min-width: 320px;
    min-height: 100vh;
    overflow-x: hidden;
  }

  #root {
    max-width: 1280px;
    margin: 0 auto;
    padding: 2rem;
    text-align: center;
    width: 100%;
  }

  h1 {
    font-size: 3.2em;
    line-height: 1.1;
  }

  button:hover {
    background-color: #535bf2 !important;
  }

  button:focus,
  button:focus-visible {
    outline: 4px auto -webkit-focus-ring-color;
  }

  input:focus {
    outline: none;
    border-color: #646cff !important;
  }

  @media (max-width: 640px) {
    #root {
      padding: 1rem;
    }
    
    body {
      align-items: flex-start;
    }
  }

  @media (prefers-color-scheme: light) {
    :root {
      color: #213547;
      background-color: #ffffff;
      
      /* Light mode colors */
      --text-primary: #213547;
      --text-secondary: #666666;
      --text-tertiary: #666666;
      --text-muted: #777777;
      --bg-card: #fafafa;
      --bg-card-alt: #ffffff;
      --bg-secondary: #f0f0f0;
      --border-color: #e5e5e5;
      --border-table: #dddddd;
      --button-bg: transparent;
      --button-bg-active: #ffffff;
      --button-text: #666666;
      --button-text-active: #213547;
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
