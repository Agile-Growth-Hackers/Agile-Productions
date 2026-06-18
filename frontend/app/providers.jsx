'use client';

import { useEffect } from 'react';
import { AuthProvider } from '../src/context/AuthContext';
import { ToastProvider } from '../src/context/ToastContext';
import { initSentry } from '../src/utils/sentryConfig';
import { initWebVitals } from '../src/utils/webVitals';
import { initPWAInstallPrompt } from '../src/utils/pwaUtils';

export default function Providers({ children }) {
  useEffect(() => {
    initSentry();
    initWebVitals();
    initPWAInstallPrompt();

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
