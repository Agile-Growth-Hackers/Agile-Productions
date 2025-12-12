import { useState, useEffect } from 'react';

/**
 * Hook to detect if animations should be reduced based on:
 * 1. User preference (prefers-reduced-motion)
 * 2. Device capabilities (low CPU/RAM)
 * 3. Performance issues (low FPS)
 *
 * @returns {boolean} shouldReduceMotion - True if animations should be disabled
 */
export const useReducedMotion = () => {
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);

  useEffect(() => {
    // 1. Check user preference for reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (mediaQuery.matches) {
      setShouldReduceMotion(true);
      return;
    }

    // Listen for changes to the preference
    const handleChange = (e) => {
      setShouldReduceMotion(e.matches);
    };
    mediaQuery.addEventListener('change', handleChange);

    // 2. Check device capabilities
    const checkDeviceCapabilities = () => {
      const hardwareConcurrency = navigator.hardwareConcurrency || 4;
      const deviceMemory = navigator.deviceMemory || 4;

      // Consider low-end: 4 or fewer cores OR 2GB or less RAM
      const isLowEndDevice = hardwareConcurrency <= 4 || deviceMemory <= 2;

      if (isLowEndDevice) {
        setShouldReduceMotion(true);
        return true;
      }
      return false;
    };

    // Skip FPS monitoring if already determined to reduce motion
    if (checkDeviceCapabilities()) {
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    // 3. Monitor frame rate to detect performance issues
    let frameCount = 0;
    let lastTime = performance.now();
    let lowFpsCount = 0;
    let animationFrameId;

    const checkFrameRate = () => {
      frameCount++;
      const currentTime = performance.now();

      // Check FPS every second
      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));

        // If FPS is consistently below 30, disable animations
        if (fps < 30) {
          lowFpsCount++;

          // Disable animations after 2 consecutive seconds of low FPS
          if (lowFpsCount >= 2) {
            setShouldReduceMotion(true);
            cancelAnimationFrame(animationFrameId);
            return;
          }
        } else {
          // Reset counter if FPS improves
          lowFpsCount = 0;
        }

        frameCount = 0;
        lastTime = currentTime;
      }

      animationFrameId = requestAnimationFrame(checkFrameRate);
    };

    // Start monitoring FPS
    animationFrameId = requestAnimationFrame(checkFrameRate);

    // Cleanup
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return shouldReduceMotion;
};
