'use client';

import { useState, useEffect } from 'react';
import api from '../services/api';

/**
 * Custom hook to fetch and cache page content from the API
 * Caches content in sessionStorage with 30s TTL
 *
 * @returns {Object} { content, loading, error, refetch }
 */
export function usePageContent(initialContent = null) {
  // Seed from server-rendered data (when provided) so the content is present in
  // the initial HTML — no flash, and no client-fetch wait for the LCP element.
  const hasInitial = initialContent && Object.keys(initialContent).length > 0;
  const [content, setContent] = useState(hasInitial ? initialContent : {});
  const [loading, setLoading] = useState(!hasInitial);
  const [error, setError] = useState(null);

  const fetchContent = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first
      const cached = sessionStorage.getItem('page_content');
      const cacheTime = sessionStorage.getItem('page_content_time');

      // Use cache if valid (within 30 seconds)
      if (cached && cacheTime && Date.now() - parseInt(cacheTime) < 30000) {
        setContent(JSON.parse(cached));
        setLoading(false);
        return;
      }

      // Fetch from API (public endpoint, no auth required)
      const data = await api.getPublicPageContent();

      // Backend already returns as object { hero_title: "...", about_title: "...", ... }
      // No need to transform

      // Update state and cache
      setContent(data);
      sessionStorage.setItem('page_content', JSON.stringify(data));
      sessionStorage.setItem('page_content_time', Date.now().toString());
    } catch (err) {
      console.error('Error fetching page content:', err);
      setError(err.message || 'Failed to load page content');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  return {
    content,
    loading,
    error,
    refetch: fetchContent // Allow manual refetch
  };
}
