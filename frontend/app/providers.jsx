'use client';

import { useEffect } from 'react';
import { AuthProvider } from '../src/context/AuthContext';
import { ToastProvider } from '../src/context/ToastContext';
import { initWebVitals } from '../src/utils/webVitals';
import { initPWAInstallPrompt } from '../src/utils/pwaUtils';

export default function Providers({ children }) {
  useEffect(() => {
    // Defer non-critical init off the hydration critical path (lowers mobile TBT).
    const runIdle = () => {
      initWebVitals();
      initPWAInstallPrompt();
    };
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(runIdle, { timeout: 2000 });
    } else {
      setTimeout(runIdle, 1);
    }

    if (process.env.NODE_ENV === 'production') {
      console.log = () => {};
      console.debug = () => {};
      console.info = () => {};
      console.warn = () => {};
    }
  }, []);

  return (
    <AuthProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </AuthProvider>
  );
}
