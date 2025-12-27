import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { initWebVitals } from './utils/webVitals'
import { initSentry } from './utils/sentryConfig'

// Initialize Sentry error tracking
initSentry();

// Initialize Web Vitals performance monitoring
initWebVitals();

// Remove console logs in production
if (import.meta.env.PROD) {
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
  console.warn = () => {};
  // Keep console.error for critical issues
}

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
