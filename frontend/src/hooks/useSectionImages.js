import { useState, useEffect } from 'react';
import api from '../services/api';

/**
 * Custom hook to fetch and cache section images
 * Returns images as object: { services_known_for: { url: "...", alt: "..." }, ... }
 */
export function useSectionImages() {
  const [images, setImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check cache
    const cached = sessionStorage.getItem('section_images');
    const cacheTime = sessionStorage.getItem('section_images_time');

    // Use cache if less than 30 seconds old
    if (cached && cacheTime && Date.now() - parseInt(cacheTime) < 30000) {
      setImages(JSON.parse(cached));
      setLoading(false);
      return;
    }

    // Fetch from API
    api.getPublicSectionImages()
      .then(data => {
        setImages(data);
        sessionStorage.setItem('section_images', JSON.stringify(data));
        sessionStorage.setItem('section_images_time', Date.now().toString());
      })
      .catch(err => {
        console.error('Failed to fetch section images:', err);
        setError(err);
      })
      .finally(() => setLoading(false));
  }, []);

  return { images, loading, error };
}
