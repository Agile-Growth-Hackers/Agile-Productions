import { useState, useEffect } from 'react';
import { registerSWUpdate, updateServiceWorker } from '../utils/pwaUtils';

/**
 * PWA Update Prompt Component
 * Shows a notification when a new version of the app is available
 */
export default function PWAUpdatePrompt() {
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    // Register for service worker updates
    registerSWUpdate(() => {
      setShowUpdate(true);
    });
  }, []);

  const handleUpdate = () => {
    setShowUpdate(false);
    updateServiceWorker();
  };

  const handleDismiss = () => {
    setShowUpdate(false);
  };

  if (!showUpdate) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-blue-600 text-white rounded-lg shadow-2xl p-4 z-50 animate-slide-down">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold mb-1">Update Available</h3>
          <p className="text-sm text-blue-100 mb-3">
            A new version is available. Reload to update.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleUpdate}
              className="px-4 py-2 bg-white text-blue-600 hover:bg-blue-50 rounded-md text-sm font-medium transition-colors"
            >
              Reload Now
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-sm font-medium transition-colors"
            >
              Later
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-blue-200 hover:text-white transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
