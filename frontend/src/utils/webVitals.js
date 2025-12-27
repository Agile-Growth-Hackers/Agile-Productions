/**
 * Web Vitals Monitoring
 * Tracks Core Web Vitals for performance monitoring
 * https://web.dev/vitals/
 */

import { onCLS, onFID, onFCP, onLCP, onTTFB, onINP } from 'web-vitals';

/**
 * Send vitals to analytics endpoint
 */
function sendToAnalytics({ name, value, rating, delta, id }) {
  // Log to console in development
  if (import.meta.env.DEV) {
    console.log('[Web Vitals]', {
      name,
      value: Math.round(value),
      rating,
      delta: Math.round(delta),
      id,
    });
  }

  // Send to analytics service (Google Analytics, custom endpoint, etc.)
  // You can uncomment and configure based on your analytics service:

  // Option 1: Google Analytics 4
  // if (window.gtag) {
  //   window.gtag('event', name, {
  //     value: Math.round(value),
  //     event_category: 'Web Vitals',
  //     event_label: id,
  //     non_interaction: true,
  //   });
  // }

  // Option 2: Custom API endpoint
  // fetch('/api/analytics/vitals', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ name, value, rating, delta, id }),
  //   keepalive: true,
  // });

  // Option 3: Cloudflare Web Analytics (automatic if configured)
}

/**
 * Initialize Web Vitals tracking
 */
export function initWebVitals() {
  // Core Web Vitals
  onCLS(sendToAnalytics);  // Cumulative Layout Shift
  onFID(sendToAnalytics);  // First Input Delay (deprecated, use INP)
  onLCP(sendToAnalytics);  // Largest Contentful Paint

  // Other important metrics
  onFCP(sendToAnalytics);  // First Contentful Paint
  onTTFB(sendToAnalytics); // Time to First Byte
  onINP(sendToAnalytics);  // Interaction to Next Paint (replaces FID)
}

/**
 * Web Vitals Thresholds
 * Good: metric is in the 75th percentile
 * Needs Improvement: between 75th and 90th percentile
 * Poor: above 90th percentile
 */
export const WEB_VITALS_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },      // Largest Contentful Paint (ms)
  FID: { good: 100, poor: 300 },        // First Input Delay (ms)
  CLS: { good: 0.1, poor: 0.25 },       // Cumulative Layout Shift (score)
  FCP: { good: 1800, poor: 3000 },      // First Contentful Paint (ms)
  TTFB: { good: 800, poor: 1800 },      // Time to First Byte (ms)
  INP: { good: 200, poor: 500 },        // Interaction to Next Paint (ms)
};
