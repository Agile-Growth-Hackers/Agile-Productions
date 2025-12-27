/**
 * PWA Utilities
 * Handles service worker registration and install prompts
 */

let deferredPrompt = null;

/**
 * Initialize PWA install prompt listener
 */
export function initPWAInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Store the event so it can be triggered later
    deferredPrompt = e;

    // Dispatch custom event to show install UI
    window.dispatchEvent(new Event('pwa-installable'));
  });

  window.addEventListener('appinstalled', () => {
    // Log install to analytics if available
    console.log('PWA was installed');
    deferredPrompt = null;

    // Dispatch custom event
    window.dispatchEvent(new Event('pwa-installed'));
  });
}

/**
 * Show the PWA install prompt
 * @returns {Promise<boolean>} True if user accepted, false if dismissed
 */
export async function showInstallPrompt() {
  if (!deferredPrompt) {
    console.log('Install prompt not available');
    return false;
  }

  // Show the install prompt
  deferredPrompt.prompt();

  // Wait for the user to respond to the prompt
  const { outcome } = await deferredPrompt.userChoice;

  // We've used the prompt, reset it
  deferredPrompt = null;

  return outcome === 'accepted';
}

/**
 * Check if PWA is installable
 * @returns {boolean}
 */
export function isPWAInstallable() {
  return deferredPrompt !== null;
}

/**
 * Check if app is already installed
 * @returns {boolean}
 */
export function isPWAInstalled() {
  // Check if running in standalone mode
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }

  // Check iOS
  if (window.navigator.standalone === true) {
    return true;
  }

  return false;
}

/**
 * Register for service worker updates
 * @param {Function} callback - Called when update is available
 */
export function registerSWUpdate(callback) {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available
            callback(registration);
          }
        });
      });
    });
  }
}

/**
 * Skip waiting and reload to activate new service worker
 */
export function updateServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });

        // Reload page when new service worker takes control
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!refreshing) {
            refreshing = true;
            window.location.reload();
          }
        });
      }
    });
  }
}
