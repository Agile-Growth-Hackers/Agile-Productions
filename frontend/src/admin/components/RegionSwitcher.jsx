import React, { useState, useRef, useEffect } from 'react';
import { useRegion } from '../../context/RegionContext';
import * as FlagIcons from 'country-flag-icons/react/3x2';

// Map region codes to flag components
const FLAG_COMPONENTS = {
  'IN': FlagIcons.IN,
  'AE': FlagIcons.AE,
  'US': FlagIcons.US,
  'GB': FlagIcons.GB,
  'AU': FlagIcons.AU,
};

export default function RegionSwitcher() {
  const { selectedRegion, setSelectedRegion, availableRegions, loading } = useRegion();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Get current region data
  const currentRegion = availableRegions.find(r => r.code === selectedRegion);
  const displayName = currentRegion?.name || 'Select Region';
  const FlagIcon = FLAG_COMPONENTS[selectedRegion];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleRegionChange = (regionCode) => {
    // TODO: Check for unsaved changes and show warning modal
    // For now, just switch directly
    setSelectedRegion(regionCode);
    setIsOpen(false);
  };

  if (loading || !selectedRegion) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-500">
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Loading regions...</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Region Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300 min-h-[40px]"
      >
        {/* Globe Icon */}
        <svg className="w-5 h-5 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>

        {/* Region Name */}
        <span className="text-sm font-medium text-gray-700 flex-shrink-0 leading-none">{displayName}</span>

        {/* Flag Icon */}
        {FlagIcon && (
          <FlagIcon className="w-6 h-4 flex-shrink-0" style={{ display: 'block', verticalAlign: 'middle' }} />
        )}

        {/* Dropdown Arrow */}
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {/* Header */}
          <div className="px-4 py-2 border-b border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Select Region
            </p>
          </div>

          {/* Region List */}
          <div className="py-1 max-h-64 overflow-y-auto">
            {availableRegions.map((region) => (
              <button
                key={region.code}
                onClick={() => handleRegionChange(region.code)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center justify-between ${
                  region.code === selectedRegion ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  {/* Region Flag Icon */}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden ${
                      region.code === selectedRegion ? 'bg-blue-50' : 'bg-gray-50'
                    }`}
                  >
                    {FLAG_COMPONENTS[region.code] ? (
                      React.createElement(FLAG_COMPONENTS[region.code], { className: 'w-8 h-8' })
                    ) : (
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>

                  {/* Region Info */}
                  <div>
                    <p className={`font-medium ${
                      region.code === selectedRegion ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {region.name}
                    </p>
                    {region.domain && (
                      <p className="text-xs text-gray-500">{region.domain}</p>
                    )}
                  </div>
                </div>

                {/* Selected Indicator */}
                {region.code === selectedRegion && (
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>

          {/* Footer Info */}
          <div className="px-4 py-2 border-t border-gray-200 mt-1">
            <p className="text-xs text-gray-500">
              {availableRegions.length} region{availableRegions.length !== 1 ? 's' : ''} available
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
