/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const RegionContext = createContext(null);

export function RegionProvider({ children }) {
  const [selectedRegion, setSelectedRegionState] = useState(null);
  const [availableRegions, setAvailableRegions] = useState([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAvailableRegions = async () => {
      try {
        // Fetch regions the admin has access to
        const data = await api.getAvailableRegions();
        setAvailableRegions(data.availableRegions || []);
        setIsSuperAdmin(data.isSuperAdmin || false);

        // Get stored region from localStorage
        const storedRegion = localStorage.getItem('admin_selected_region');

        // Validate stored region is in available list
        const validRegion = data.availableRegions?.find(r => r.code === storedRegion);

        if (validRegion) {
          setSelectedRegionState(storedRegion);
        } else if (data.availableRegions?.length > 0) {
          // Default to first available region
          const defaultRegion = data.availableRegions[0].code;
          setSelectedRegionState(defaultRegion);
          localStorage.setItem('admin_selected_region', defaultRegion);
        }
      } catch (error) {
        console.error('Failed to fetch available regions:', error);
        setAvailableRegions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableRegions();
  }, []);

  const setSelectedRegion = useCallback((region) => {
    localStorage.setItem('admin_selected_region', region);
    setSelectedRegionState(region);
  }, []);

  const value = {
    selectedRegion,
    setSelectedRegion,
    availableRegions,
    isSuperAdmin,
    loading
  };

  return (
    <RegionContext.Provider value={value}>
      {children}
    </RegionContext.Provider>
  );
}

export function useRegion() {
  const context = useContext(RegionContext);
  if (!context) {
    throw new Error('useRegion must be used within RegionProvider');
  }
  return context;
}
