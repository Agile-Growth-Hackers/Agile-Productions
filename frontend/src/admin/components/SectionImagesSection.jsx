import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useRegion } from '../../context/RegionContext';
import ImagePickerModal from './ImagePickerModal';
import * as FlagIcons from 'country-flag-icons/react/3x2';

const SECTION_IMAGES = [
  {
    key: 'services_known_for',
    label: 'Known For Image',
    description: 'Image for "We Are Known For" section'
  },
  {
    key: 'services_event_coverage',
    label: 'Event Coverage Image',
    description: 'Image for event coverage section'
  },
  {
    key: 'services_ad_films',
    label: 'Ad Films Image',
    description: 'Image for ad films & promo section'
  },
  {
    key: 'services_brand_coverage',
    label: 'Brand Coverage Image',
    description: 'Image for brand coverage section'
  }
];

export default function SectionImagesSection() {
  const { showToast } = useToast();
  const { selectedRegion } = useRegion();
  const [images, setImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [editingSection, setEditingSection] = useState(null);

  const fetchImages = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getSectionImages(selectedRegion);
      // Transform array to object keyed by section_key
      const imagesMap = {};
      data.forEach(img => {
        imagesMap[img.section_key] = img;
      });
      setImages(imagesMap);
    } catch (err) {
      setError('Failed to load section images');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedRegion]);

  useEffect(() => {
    if (selectedRegion) {
      fetchImages();
    }
  }, [selectedRegion, fetchImages]);

  const handleSelectImage = (sectionKey) => {
    setEditingSection(sectionKey);
    setShowPicker(true);
  };

  const handleImageSelected = async (selectedImage) => {
    try {
      await api.uploadSectionImage(editingSection, selectedImage, selectedRegion);
      setShowPicker(false);
      setEditingSection(null);
      await fetchImages();
      showToast('Section image updated successfully!', 'success');
    } catch (err) {
      setError('Failed to update section image');
      showToast(err.message || 'Failed to update section image', 'error');
      console.error(err);
    }
  };

  const handleRemoveImage = async (sectionKey) => {
    if (!confirm('Are you sure you want to remove this image?')) {
      return;
    }

    try {
      await api.deleteSectionImage(sectionKey, selectedRegion);
      await fetchImages();
      showToast('Section image removed successfully!', 'success');
    } catch (err) {
      setError('Failed to remove section image');
      showToast(err.message || 'Failed to remove section image', 'error');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Section Images</h2>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading images...</p>
          </div>
        </div>
      </section>
    );
  }

  const FlagIcon = FlagIcons[selectedRegion];

  return (
    <section className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-bold text-gray-900">Section Images</h2>
          {FlagIcon && <FlagIcon className="w-6 h-4" title={selectedRegion} />}
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Manage background images for website sections
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SECTION_IMAGES.map(section => {
          const image = images[section.key];

          return (
            <div key={section.key} className="border border-gray-200 rounded-lg p-4">
              <div className="mb-3">
                <h3 className="text-base font-semibold text-gray-900">{section.label}</h3>
                <p className="text-xs text-gray-500 mt-1">{section.description}</p>
              </div>

              {image && image.cdn_url ? (
                <div className="relative group">
                  {/* Image Preview */}
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={image.cdn_url}
                      alt={image.alt_text || section.label}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Image Info */}
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Alt Text:</span>
                      <span className="text-gray-700 font-medium">{image.alt_text || 'None'}</span>
                    </div>
                    {image.cdn_url_mobile && (
                      <div className="flex items-center space-x-1 text-xs text-green-600">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>Mobile variant available</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={() => handleSelectImage(section.key)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Replace</span>
                    </button>
                    <button
                      onClick={() => handleRemoveImage(section.key)}
                      className="px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-gray-500 mb-4">No image set</p>
                  <button
                    onClick={() => handleSelectImage(section.key)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Select Image</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Image Picker Modal */}
      {showPicker && (
        <ImagePickerModal
          isOpen={showPicker}
          category="sections"
          onSelect={handleImageSelected}
          onClose={() => {
            setShowPicker(false);
            setEditingSection(null);
          }}
        />
      )}
    </section>
  );
}
