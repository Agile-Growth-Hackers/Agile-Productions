import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useRegion } from '../../context/RegionContext';
import ImagePickerModal from './ImagePickerModal';
import ConfirmModal from './ConfirmModal';
import * as FlagIcons from 'country-flag-icons/react/3x2';

export default function GallerySection() {
  const { showToast } = useToast();
  const { selectedRegion } = useRegion();
  const [galleryImages, setGalleryImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewMode, setPreviewMode] = useState('desktop'); // 'desktop' or 'mobile'
  const [showPicker, setShowPicker] = useState(false);
  const [editingImageId, setEditingImageId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [imageIdToRemove, setImageIdToRemove] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const fetchGalleryImages = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getAdminGallery(selectedRegion);
      setGalleryImages(data);
    } catch (err) {
      setError('Failed to load gallery images');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedRegion]);

  useEffect(() => {
    if (selectedRegion) {
      fetchGalleryImages();
    }
  }, [selectedRegion, fetchGalleryImages]);

  const handleEditImage = (imageId) => {
    setEditingImageId(imageId);
    setShowPicker(true);
  };

  const handleRemoveImage = (imageId) => {
    setImageIdToRemove(imageId);
    setShowConfirmModal(true);
  };

  const confirmRemoveImage = async () => {
    if (!imageIdToRemove) return;

    setIsRemoving(true);
    try {
      // Update the gallery image to have empty values instead of deleting
      await api.updateGalleryImage(imageIdToRemove, {
        r2_key: '',
        cdn_url: '',
        filename: ''
      }, selectedRegion);
      await fetchGalleryImages();

      // Clear public website cache so changes show immediately
      sessionStorage.removeItem('gallery_mobile');
      sessionStorage.removeItem('gallery_mobile_time');
      sessionStorage.removeItem('gallery_desktop');
      sessionStorage.removeItem('gallery_desktop_time');

      showToast('Image cleared from position', 'success');
      setShowConfirmModal(false);
      setImageIdToRemove(null);
    } catch (err) {
      setError('Failed to clear image');
      showToast(err.message || 'Failed to clear image', 'error');
      console.error(err);
    } finally {
      setIsRemoving(false);
    }
  };

  const cancelRemoveImage = () => {
    setShowConfirmModal(false);
    setImageIdToRemove(null);
  };

  const handleSelectImage = async (selectedImage) => {
    try {
      if (editingImageId) {
        await api.updateGalleryImage(editingImageId, {
          r2_key: selectedImage.r2_key,
          cdn_url: selectedImage.cdn_url,
          cdn_url_mobile: selectedImage.cdn_url_mobile,
          filename: selectedImage.filename
        }, selectedRegion);
        showToast('Gallery image updated successfully!', 'success');
      } else {
        await api.addGalleryImage({
          r2_key: selectedImage.r2_key,
          cdn_url: selectedImage.cdn_url,
          cdn_url_mobile: selectedImage.cdn_url_mobile,
          filename: selectedImage.filename
        }, selectedRegion);
        showToast('Gallery image added successfully!', 'success');
      }
      await fetchGalleryImages();

      // Clear public website cache so changes show immediately
      sessionStorage.removeItem('gallery_mobile');
      sessionStorage.removeItem('gallery_mobile_time');
      sessionStorage.removeItem('gallery_desktop');
      sessionStorage.removeItem('gallery_desktop_time');

      setError('');
    } catch (err) {
      setError('Failed to update gallery image');
      showToast(err.message || 'Failed to update gallery image', 'error');
      console.error(err);
    }
  };

  const handleToggleMobileHidden = async (imageId, currentlyVisible) => {
    const visibleCount = galleryImages.filter(img => img.mobile_visible !== 0).length;

    // If trying to show a hidden image, check if we already have 10 visible
    if (!currentlyVisible && visibleCount >= 10) {
      setError('Maximum 10 images can be visible on mobile. Hide another image first.');
      showToast('Maximum 10 images can be visible on mobile', 'error');
      return;
    }

    try {
      // Toggle the visibility (if currently visible, make it hidden, and vice versa)
      await api.toggleGalleryMobileVisibility(imageId, !currentlyVisible, selectedRegion);
      await fetchGalleryImages();
      setError('');
      showToast(currentlyVisible ? 'Image hidden on mobile' : 'Image will show on mobile', 'success');
    } catch (err) {
      setError('Failed to update mobile visibility');
      showToast(err.message || 'Failed to update mobile visibility', 'error');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Gallery</h2>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading gallery...</p>
          </div>
        </div>
      </section>
    );
  }

  // For mobile: show first 10 visible images in the template
  // For desktop: show first 12 images in the template
  // Note: mobile_visible = 1 means visible, 0 means hidden
  const visibleImages = galleryImages.filter(img => img.mobile_visible !== 0);
  const hiddenImages = galleryImages.filter(img => img.mobile_visible === 0);

  const displayImages = previewMode === 'mobile'
    ? visibleImages.slice(0, 10)
    : galleryImages.slice(0, 12);

  const hiddenMobileCount = hiddenImages.length;
  const visibleMobileCount = visibleImages.length;

  // Edit icon component - minimal overlay
  const EditIcon = ({ imageId }) => (
    <button
      onClick={() => handleEditImage(imageId)}
      className="absolute top-2 right-2 z-20 bg-blue-600/90 text-white rounded-full p-1.5 hover:bg-blue-700 transition-colors shadow-lg pointer-events-auto"
      title="Change image"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    </button>
  );

  // Remove icon component - minimal overlay
  const RemoveIcon = ({ imageId }) => (
    <button
      onClick={() => handleRemoveImage(imageId)}
      className="absolute top-2 right-12 z-20 bg-red-600/90 text-white rounded-full p-1.5 hover:bg-red-700 transition-colors shadow-lg pointer-events-auto"
      title="Remove from gallery"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );

  // Add image button for empty positions
  const AddImageButton = ({ positionId }) => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-200 hover:border-gray-400 transition-colors cursor-pointer"
      onClick={() => handleEditImage(positionId)}
    >
      <div className="text-center">
        <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <p className="text-gray-500 text-sm font-medium">Add Image</p>
      </div>
    </div>
  );

  // Hide on mobile checkbox - minimal overlay
  const HideOnMobileCheckbox = ({ image }) => {
    const isVisible = image.mobile_visible !== 0;
    const isHidden = !isVisible;
    const isDisabled = !isVisible && visibleMobileCount >= 10;

    return (
      <div
        className={`absolute bottom-2 left-2 z-20 backdrop-blur-sm rounded px-1.5 py-1 shadow-md text-xs pointer-events-auto ${
          isHidden ? 'bg-red-100/95 border border-red-300' : 'bg-white/95'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <label className="flex items-center space-x-1 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isHidden}
            onChange={() => handleToggleMobileHidden(image.id, isVisible)}
            disabled={isDisabled}
            className="w-3 h-3 text-red-600 border-gray-300 rounded focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          />
          <span className={`font-medium ${
            isDisabled ? 'text-gray-400' : isHidden ? 'text-red-700' : 'text-gray-700'
          }`}>
            {isHidden ? 'Hidden' : 'Hide'}
          </span>
        </label>
      </div>
    );
  };

  const FlagIcon = FlagIcons[selectedRegion];

  return (
    <section className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-gray-900">Gallery</h2>
            {FlagIcon && <FlagIcon className="w-6 h-4" title={selectedRegion} />}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {galleryImages.length} total • {visibleMobileCount} visible on mobile • {hiddenMobileCount} hidden
          </p>
        </div>

        {/* Preview Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setPreviewMode('desktop')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              previewMode === 'desktop'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Desktop Preview (12)
          </button>
          <button
            onClick={() => setPreviewMode('mobile')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              previewMode === 'mobile'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Mobile Preview ({Math.min(visibleMobileCount, 10)})
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {galleryImages.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-600 mb-2">No gallery images yet</p>
          <p className="text-sm text-gray-500">Start by adding images to the gallery</p>
        </div>
      ) : previewMode === 'mobile' && visibleMobileCount === 0 ? (
        <div className="text-center py-12 bg-yellow-50 rounded-lg border border-yellow-200">
          <svg className="w-12 h-12 text-yellow-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-yellow-800 mb-2">All images are hidden on mobile</p>
          <p className="text-sm text-yellow-600">Uncheck "Hide on mobile" for at least one image</p>
        </div>
      ) : (
        <>
          {/* Mobile: Custom Collage Grid - EXACT COPY FROM FRONTEND */}
          {previewMode === 'mobile' && (
            <div
              className="relative overflow-visible mx-auto"
              style={{
                maxWidth: '400px'
              }}
            >
              <div
                className="grid gap-1.5 overflow-visible rounded-3xl"
                style={{
                  gridTemplateColumns: '1fr 1.3fr 1.1fr',
                  gridTemplateRows: 'repeat(20, 1fr)',
                  height: '750px'
                }}
              >
                {/* Image 1: Top-left corner - small */}
                <div
                  style={{
                    gridRow: '1 / 4',
                    gridColumn: '1'
                  }}
                  className="relative overflow-visible rounded-tl-3xl"
                >
                  {displayImages[0] && displayImages[0].cdn_url && displayImages[0].cdn_url !== '' ? (
                    <>
                      <img
                        src={displayImages[0].cdn_url}
                        alt={`Gallery ${displayImages[0].id}`}
                        loading="lazy"
                        className="w-full h-full object-cover rounded-tl-3xl grayscale brightness-75"
                        style={{
                          borderRadius: '24px 0 0 0',
                          position: 'relative'
                        }}
                      />
                      <RemoveIcon imageId={displayImages[0].id} />

                      <EditIcon imageId={displayImages[0].id} />
                      <HideOnMobileCheckbox image={displayImages[0]} />
                    </>
                  ) : displayImages[0] ? (
                    <AddImageButton positionId={displayImages[0].id} />
                  ) : null}
                </div>

                {/* Image 2: Top-center - tall */}
                <div
                  style={{
                    gridRow: '1 / 6',
                    gridColumn: '2'
                  }}
                  className="relative overflow-visible"
                >
                  {displayImages[1] && displayImages[1].cdn_url && displayImages[1].cdn_url !== '' ? (
                    <>
                      <img
                        src={displayImages[1].cdn_url}
                        alt={`Gallery ${displayImages[1].id}`}
                        loading="lazy"
                        className="w-full h-full object-cover grayscale brightness-75"
                        style={{
                          borderRadius: '0',
                          position: 'relative'
                        }}
                      />
                      <RemoveIcon imageId={displayImages[1].id} />

                      <EditIcon imageId={displayImages[1].id} />
                      <HideOnMobileCheckbox image={displayImages[1]} />
                    </>
                  ) : displayImages[1] ? (
                    <AddImageButton positionId={displayImages[1].id} />
                  ) : null}
                </div>

                {/* Image 3: Top-right corner - medium */}
                <div
                  style={{
                    gridRow: '1 / 6',
                    gridColumn: '3'
                  }}
                  className="relative overflow-visible rounded-tr-3xl"
                >
                  {displayImages[2] && displayImages[2].cdn_url && displayImages[2].cdn_url !== '' ? (
                    <>
                      <img
                        src={displayImages[2].cdn_url}
                        alt={`Gallery ${displayImages[2].id}`}
                        loading="lazy"
                        className="w-full h-full object-cover rounded-tr-3xl grayscale brightness-75"
                        style={{
                          boxShadow: '0 0 0 rgba(0,0,0,0)',
                          borderRadius: '0 24px 0 0',
                          position: 'relative'
                        }}
                      />
                      <RemoveIcon imageId={displayImages[2].id} />

                      <EditIcon imageId={displayImages[2].id} />
                      <HideOnMobileCheckbox image={displayImages[2]} />
                    </>
                  ) : displayImages[2] ? (
                    <AddImageButton positionId={displayImages[2].id} />
                  ) : null}
                </div>

                {/* Image 4: Middle-left - small */}
                <div
                  style={{
                    gridRow: '4 / 7',
                    gridColumn: '1'
                  }}
                  className="relative overflow-visible"
                >
                  {displayImages[3] && displayImages[3].cdn_url && displayImages[3].cdn_url !== '' ? (
                    <>
                      <img
                        src={displayImages[3].cdn_url}
                        alt={`Gallery ${displayImages[3].id}`}
                        loading="lazy"
                        className="w-full h-full object-cover grayscale brightness-75"
                        style={{
                          boxShadow: '0 0 0 rgba(0,0,0,0)',
                          borderRadius: '0',
                          position: 'relative'
                        }}
                      />
                      <RemoveIcon imageId={displayImages[3].id} />

                      <EditIcon imageId={displayImages[3].id} />
                      <HideOnMobileCheckbox image={displayImages[3]} />
                    </>
                  ) : displayImages[3] ? (
                    <AddImageButton positionId={displayImages[3].id} />
                  ) : null}
                </div>

                {/* Image 5: Center - large spanning 2 columns */}
                <div
                  style={{
                    gridRow: '6 / 11',
                    gridColumn: '2 / 4'
                  }}
                  className="relative overflow-visible"
                >
                  {displayImages[4] && displayImages[4].cdn_url && displayImages[4].cdn_url !== '' ? (
                    <>
                      <img
                        src={displayImages[4].cdn_url}
                        alt={`Gallery ${displayImages[4].id}`}
                        loading="lazy"
                        className="w-full h-full object-cover grayscale brightness-75"
                        style={{
                          boxShadow: '0 0 0 rgba(0,0,0,0)',
                          borderRadius: '0',
                          position: 'relative'
                        }}
                      />
                      <RemoveIcon imageId={displayImages[4].id} />

                      <EditIcon imageId={displayImages[4].id} />
                      <HideOnMobileCheckbox image={displayImages[4]} />
                    </>
                  ) : displayImages[4] ? (
                    <AddImageButton positionId={displayImages[4].id} />
                  ) : null}
                </div>

                {/* Image 6: Lower-left */}
                <div
                  style={{
                    gridRow: '7 / 12',
                    gridColumn: '1'
                  }}
                  className="relative overflow-visible"
                >
                  {displayImages[5] && displayImages[5].cdn_url && displayImages[5].cdn_url !== '' ? (
                    <>
                      <img
                        src={displayImages[5].cdn_url}
                        alt={`Gallery ${displayImages[5].id}`}
                        loading="lazy"
                        className="w-full h-full object-cover grayscale brightness-75"
                        style={{
                          boxShadow: '0 0 0 rgba(0,0,0,0)',
                          borderRadius: '0',
                          position: 'relative'
                        }}
                      />
                      <RemoveIcon imageId={displayImages[5].id} />

                      <EditIcon imageId={displayImages[5].id} />
                      <HideOnMobileCheckbox image={displayImages[5]} />
                    </>
                  ) : displayImages[5] ? (
                    <AddImageButton positionId={displayImages[5].id} />
                  ) : null}
                </div>

                {/* Image 7: Lower-right */}
                <div
                  style={{
                    gridRow: '11 / 15',
                    gridColumn: '3'
                  }}
                  className="relative overflow-visible"
                >
                  {displayImages[6] && displayImages[6].cdn_url && displayImages[6].cdn_url !== '' ? (
                    <>
                      <img
                        src={displayImages[6].cdn_url}
                        alt={`Gallery ${displayImages[6].id}`}
                        loading="lazy"
                        className="w-full h-full object-cover grayscale brightness-75"
                        style={{
                          boxShadow: '0 0 0 rgba(0,0,0,0)',
                          borderRadius: '0',
                          position: 'relative'
                        }}
                      />
                      <RemoveIcon imageId={displayImages[6].id} />

                      <EditIcon imageId={displayImages[6].id} />
                      <HideOnMobileCheckbox image={displayImages[6]} />
                    </>
                  ) : displayImages[6] ? (
                    <AddImageButton positionId={displayImages[6].id} />
                  ) : null}
                </div>

                {/* Image 8: Bottom-left corner */}
                <div
                  style={{
                    gridRow: '12 / 16',
                    gridColumn: '1'
                  }}
                  className="relative overflow-visible rounded-bl-3xl"
                >
                  {displayImages[7] && displayImages[7].cdn_url && displayImages[7].cdn_url !== '' ? (
                    <>
                      <img
                        src={displayImages[7].cdn_url}
                        alt={`Gallery ${displayImages[7].id}`}
                        loading="lazy"
                        className="w-full h-full object-cover rounded-bl-3xl grayscale brightness-75"
                        style={{
                          boxShadow: '0 0 0 rgba(0,0,0,0)',
                          borderRadius: '0 0 0 24px',
                          position: 'relative'
                        }}
                      />
                      <RemoveIcon imageId={displayImages[7].id} />

                      <EditIcon imageId={displayImages[7].id} />
                      <HideOnMobileCheckbox image={displayImages[7]} />
                    </>
                  ) : displayImages[7] ? (
                    <AddImageButton positionId={displayImages[7].id} />
                  ) : null}
                </div>

                {/* Image 9: Bottom-center */}
                <div
                  style={{
                    gridRow: '11 / 16',
                    gridColumn: '2'
                  }}
                  className="relative overflow-visible"
                >
                  {displayImages[8] && displayImages[8].cdn_url && displayImages[8].cdn_url !== '' ? (
                    <>
                      <img
                        src={displayImages[8].cdn_url}
                        alt={`Gallery ${displayImages[8].id}`}
                        loading="lazy"
                        className="w-full h-full object-cover grayscale brightness-75"
                        style={{
                          boxShadow: '0 0 0 rgba(0,0,0,0)',
                          borderRadius: '0',
                          position: 'relative'
                        }}
                      />
                      <RemoveIcon imageId={displayImages[8].id} />

                      <EditIcon imageId={displayImages[8].id} />
                      <HideOnMobileCheckbox image={displayImages[8]} />
                    </>
                  ) : displayImages[8] ? (
                    <AddImageButton positionId={displayImages[8].id} />
                  ) : null}
                </div>

                {/* Image 10: Bottom-right corner */}
                <div
                  style={{
                    gridRow: '15 / 16',
                    gridColumn: '3'
                  }}
                  className="relative overflow-visible rounded-br-3xl"
                >
                  {displayImages[9] && displayImages[9].cdn_url && displayImages[9].cdn_url !== '' ? (
                    <>
                      <img
                        src={displayImages[9].cdn_url}
                        alt={`Gallery ${displayImages[9].id}`}
                        loading="lazy"
                        className="w-full h-full object-cover rounded-br-3xl grayscale brightness-75"
                        style={{
                          boxShadow: '0 0 0 rgba(0,0,0,0)',
                          borderRadius: '0 0 24px 0',
                          position: 'relative'
                        }}
                      />
                      <RemoveIcon imageId={displayImages[9].id} />

                      <EditIcon imageId={displayImages[9].id} />
                      <HideOnMobileCheckbox image={displayImages[9]} />
                    </>
                  ) : displayImages[9] ? (
                    <AddImageButton positionId={displayImages[9].id} />
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {/* Desktop: Custom Complex Grid - EXACT COPY FROM FRONTEND */}
          {previewMode === 'desktop' && (
            <div
              className="grid gap-1.5 overflow-visible mx-auto"
              style={{
                gridTemplateColumns: '1fr 1.3fr 1.5fr 1.5fr 1.6fr',
                gridTemplateRows: 'repeat(12, 1fr)',
                height: '550px',
                maxWidth: '1200px'
              }}
            >
              {/* Image 1: R1C1 - Top Left Corner */}
              <div
                style={{
                  gridRow: '1 / 5',
                  gridColumn: '1'
                }}
                className="relative overflow-visible rounded-tl-3xl"
              >
                {displayImages[0] && displayImages[0].cdn_url && displayImages[0].cdn_url !== '' ? (
                  <>
                    <img
                      src={displayImages[0].cdn_url}
                      alt={`Gallery ${displayImages[0].id}`}
                      loading="lazy"
                      className="w-full h-full object-cover rounded-tl-3xl grayscale brightness-75"
                      style={{
                        boxShadow: '0 0 0 rgba(0,0,0,0)',
                        borderRadius: '24px 0 0 0',
                        position: 'relative'
                      }}
                    />
                    <RemoveIcon imageId={displayImages[0].id} />

                    <EditIcon imageId={displayImages[0].id} />
                    <HideOnMobileCheckbox image={displayImages[0]} />
                  </>
                ) : displayImages[0] ? (
                  <AddImageButton positionId={displayImages[0].id} />
                ) : null}
              </div>

              {/* Image 2: R1C2 */}
              <div
                style={{
                  gridRow: '1 / 5',
                  gridColumn: '2'
                }}
                className="relative overflow-visible"
              >
                {displayImages[1] && displayImages[1].cdn_url && displayImages[1].cdn_url !== '' ? (
                  <>
                    <img
                      src={displayImages[1].cdn_url}
                      alt={`Gallery ${displayImages[1].id}`}
                      loading="lazy"
                      className="w-full h-full object-cover grayscale brightness-75"
                      style={{
                        boxShadow: '0 0 0 rgba(0,0,0,0)',
                        borderRadius: '0',
                        position: 'relative'
                      }}
                    />
                    <RemoveIcon imageId={displayImages[1].id} />

                    <EditIcon imageId={displayImages[1].id} />
                    <HideOnMobileCheckbox image={displayImages[1]} />
                  </>
                ) : displayImages[1] ? (
                  <AddImageButton positionId={displayImages[1].id} />
                ) : null}
              </div>

              {/* Image 3: R1C3 + R2C3 (spans 2 rows) */}
              <div
                style={{
                  gridRow: '1 / 9',
                  gridColumn: '3'
                }}
                className="relative overflow-visible"
              >
                {displayImages[2] && displayImages[2].cdn_url && displayImages[2].cdn_url !== '' ? (
                  <>
                    <img
                      src={displayImages[2].cdn_url}
                      alt={`Gallery ${displayImages[2].id}`}
                      loading="lazy"
                      className="w-full h-full object-cover grayscale brightness-75"
                      style={{
                        boxShadow: '0 0 0 rgba(0,0,0,0)',
                        borderRadius: '0',
                        position: 'relative'
                      }}
                    />
                    <RemoveIcon imageId={displayImages[2].id} />

                    <EditIcon imageId={displayImages[2].id} />
                    <HideOnMobileCheckbox image={displayImages[2]} />
                  </>
                ) : displayImages[2] ? (
                  <AddImageButton positionId={displayImages[2].id} />
                ) : null}
              </div>

              {/* Image 4: R1C4 + part of R2C4 */}
              <div
                style={{
                  gridRow: '1 / 6',
                  gridColumn: '4'
                }}
                className="relative overflow-visible"
              >
                {displayImages[3] && displayImages[3].cdn_url && displayImages[3].cdn_url !== '' ? (
                  <>
                    <img
                      src={displayImages[3].cdn_url}
                      alt={`Gallery ${displayImages[3].id}`}
                      loading="lazy"
                      className="w-full h-full object-cover grayscale brightness-75"
                      style={{
                        boxShadow: '0 0 0 rgba(0,0,0,0)',
                        borderRadius: '0',
                        position: 'relative'
                      }}
                    />
                    <RemoveIcon imageId={displayImages[3].id} />

                    <EditIcon imageId={displayImages[3].id} />
                    <HideOnMobileCheckbox image={displayImages[3]} />
                  </>
                ) : displayImages[3] ? (
                  <AddImageButton positionId={displayImages[3].id} />
                ) : null}
              </div>

              {/* Image 5: More than half of R1C5 (increased height) - Top Right Corner */}
              <div
                style={{
                  gridRow: '1 / 4',
                  gridColumn: '5'
                }}
                className="relative group overflow-visible rounded-tr-3xl"
              >
                {displayImages[4] && displayImages[4].cdn_url && displayImages[4].cdn_url !== '' ? (
                  <>
                    <img
                      src={displayImages[4].cdn_url}
                      alt={`Gallery ${displayImages[4].id}`}
                      loading="lazy"
                      className="w-full h-full object-cover rounded-tr-3xl grayscale brightness-75"
                      style={{
                        boxShadow: '0 0 0 rgba(0,0,0,0)',
                        borderRadius: '0 24px 0 0',
                        position: 'relative'
                      }}
                    />
                    <RemoveIcon imageId={displayImages[4].id} />

                    <EditIcon imageId={displayImages[4].id} />
                    <HideOnMobileCheckbox image={displayImages[4]} />
                  </>
                ) : displayImages[4] ? (
                  <AddImageButton positionId={displayImages[4].id} />
                ) : null}
              </div>

              {/* Image 6: R2C1 + R2C2 (spans 2 columns) */}
              <div
                style={{
                  gridRow: '5 / 9',
                  gridColumn: '1 / 3'
                }}
                className="relative overflow-visible"
              >
                {displayImages[5] && displayImages[5].cdn_url && displayImages[5].cdn_url !== '' ? (
                  <>
                    <img
                      src={displayImages[5].cdn_url}
                      alt={`Gallery ${displayImages[5].id}`}
                      loading="lazy"
                      className="w-full h-full object-cover grayscale brightness-75"
                      style={{
                        boxShadow: '0 0 0 rgba(0,0,0,0)',
                        borderRadius: '0',
                        position: 'relative'
                      }}
                    />
                    <RemoveIcon imageId={displayImages[5].id} />

                    <EditIcon imageId={displayImages[5].id} />
                    <HideOnMobileCheckbox image={displayImages[5]} />
                  </>
                ) : displayImages[5] ? (
                  <AddImageButton positionId={displayImages[5].id} />
                ) : null}
              </div>

              {/* Image 7: Rest of R2C4 + R3C4 */}
              <div
                style={{
                  gridRow: '6 / 13',
                  gridColumn: '4'
                }}
                className="relative overflow-visible"
              >
                {displayImages[6] && displayImages[6].cdn_url && displayImages[6].cdn_url !== '' ? (
                  <>
                    <img
                      src={displayImages[6].cdn_url}
                      alt={`Gallery ${displayImages[6].id}`}
                      loading="lazy"
                      className="w-full h-full object-cover grayscale brightness-75"
                      style={{
                        boxShadow: '0 0 0 rgba(0,0,0,0)',
                        borderRadius: '0',
                        position: 'relative'
                      }}
                    />
                    <RemoveIcon imageId={displayImages[6].id} />

                    <EditIcon imageId={displayImages[6].id} />
                    <HideOnMobileCheckbox image={displayImages[6]} />
                  </>
                ) : displayImages[6] ? (
                  <AddImageButton positionId={displayImages[6].id} />
                ) : null}
              </div>

              {/* Image 8: Rest of R1C5 + R2C5 + part of R3C5 (reduced height) */}
              <div
                style={{
                  gridRow: '4 / 10',
                  gridColumn: '5'
                }}
                className="relative overflow-visible"
              >
                {displayImages[7] && displayImages[7].cdn_url && displayImages[7].cdn_url !== '' ? (
                  <>
                    <img
                      src={displayImages[7].cdn_url}
                      alt={`Gallery ${displayImages[7].id}`}
                      loading="lazy"
                      className="w-full h-full object-cover grayscale brightness-75"
                      style={{
                        boxShadow: '0 0 0 rgba(0,0,0,0)',
                        borderRadius: '0',
                        position: 'relative'
                      }}
                    />
                    <RemoveIcon imageId={displayImages[7].id} />

                    <EditIcon imageId={displayImages[7].id} />
                    <HideOnMobileCheckbox image={displayImages[7]} />
                  </>
                ) : displayImages[7] ? (
                  <AddImageButton positionId={displayImages[7].id} />
                ) : null}
              </div>

              {/* Image 9: R3C1 + more of R3C2 (increased width) - Bottom Left Corner */}
              <div
                style={{
                  gridRow: '9 / 13',
                  gridColumn: '1 / 2.6'
                }}
                className="relative group overflow-visible rounded-bl-3xl"
              >
                {displayImages[8] && displayImages[8].cdn_url && displayImages[8].cdn_url !== '' ? (
                  <>
                    <img
                      src={displayImages[8].cdn_url}
                      alt={`Gallery ${displayImages[8].id}`}
                      loading="lazy"
                      className="w-full h-full object-cover rounded-bl-3xl grayscale brightness-75"
                      style={{
                        boxShadow: '0 0 0 rgba(0,0,0,0)',
                        borderRadius: '0 0 0 24px',
                        position: 'relative'
                      }}
                    />
                    <RemoveIcon imageId={displayImages[8].id} />

                    <EditIcon imageId={displayImages[8].id} />
                    <HideOnMobileCheckbox image={displayImages[8]} />
                  </>
                ) : displayImages[8] ? (
                  <AddImageButton positionId={displayImages[8].id} />
                ) : null}
              </div>

              {/* Image 10: Rest of R3C2 (reduced width) */}
              <div
                style={{
                  gridRow: '9 / 13',
                  gridColumn: '2.6 / 3'
                }}
                className="relative overflow-visible"
              >
                {displayImages[9] && displayImages[9].cdn_url && displayImages[9].cdn_url !== '' ? (
                  <>
                    <img
                      src={displayImages[9].cdn_url}
                      alt={`Gallery ${displayImages[9].id}`}
                      loading="lazy"
                      className="w-full h-full object-cover grayscale brightness-75"
                      style={{
                        boxShadow: '0 0 0 rgba(0,0,0,0)',
                        borderRadius: '0',
                        position: 'relative'
                      }}
                    />
                    <RemoveIcon imageId={displayImages[9].id} />

                    <EditIcon imageId={displayImages[9].id} />
                    <HideOnMobileCheckbox image={displayImages[9]} />
                  </>
                ) : displayImages[9] ? (
                  <AddImageButton positionId={displayImages[9].id} />
                ) : null}
              </div>

              {/* Image 11: R3C3 */}
              <div
                style={{
                  gridRow: '9 / 13',
                  gridColumn: '3'
                }}
                className="relative overflow-visible"
              >
                {displayImages[10] && displayImages[10].cdn_url && displayImages[10].cdn_url !== '' ? (
                  <>
                    <img
                      src={displayImages[10].cdn_url}
                      alt={`Gallery ${displayImages[10].id}`}
                      loading="lazy"
                      className="w-full h-full object-cover grayscale brightness-75"
                      style={{
                        boxShadow: '0 0 0 rgba(0,0,0,0)',
                        borderRadius: '0',
                        position: 'relative'
                      }}
                    />
                    <RemoveIcon imageId={displayImages[10].id} />

                    <EditIcon imageId={displayImages[10].id} />
                    <HideOnMobileCheckbox image={displayImages[10]} />
                  </>
                ) : displayImages[10] ? (
                  <AddImageButton positionId={displayImages[10].id} />
                ) : null}
              </div>

              {/* Image 12: Rest of R3C5 (increased height) - Bottom Right Corner */}
              <div
                style={{
                  gridRow: '10 / 13',
                  gridColumn: '5'
                }}
                className="relative group overflow-visible rounded-br-3xl"
              >
                {displayImages[11] && displayImages[11].cdn_url && displayImages[11].cdn_url !== '' ? (
                  <>
                    <img
                      src={displayImages[11].cdn_url}
                      alt={`Gallery ${displayImages[11].id}`}
                      loading="lazy"
                      className="w-full h-full object-cover rounded-br-3xl grayscale brightness-75"
                      style={{
                        boxShadow: '0 0 0 rgba(0,0,0,0)',
                        borderRadius: '0 0 24px 0',
                        position: 'relative'
                      }}
                    />
                    <RemoveIcon imageId={displayImages[11].id} />

                    <EditIcon imageId={displayImages[11].id} />
                    <HideOnMobileCheckbox image={displayImages[11]} />
                  </>
                ) : displayImages[11] ? (
                  <AddImageButton positionId={displayImages[11].id} />
                ) : null}
              </div>
            </div>
          )}
        </>
      )}

      {/* Additional Images Section - Images not shown in the main preview */}
      {(() => {
        const remainingImages = previewMode === 'mobile'
          ? [...visibleImages.slice(10), ...hiddenImages]
          : [...galleryImages.slice(12), ...hiddenImages.filter((img, idx) => idx >= 12 || !galleryImages.slice(0, 12).includes(img))];

        if (remainingImages.length > 0) {
          return (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {previewMode === 'mobile'
                  ? `Images Beyond Mobile View (${remainingImages.length})`
                  : `Additional Images (${remainingImages.length})`}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {remainingImages.map((image) => (
                  <div key={image.id} className="relative aspect-square group">
                    <img
                      src={image.cdn_url}
                      alt={`Gallery ${image.id}`}
                      loading="lazy"
                      className="w-full h-full object-cover rounded-lg grayscale brightness-75"
                    />
                    <RemoveIcon imageId={image.id} />

                    <EditIcon imageId={image.id} />
                    <HideOnMobileCheckbox image={image} />
                    {previewMode === 'mobile' && image.mobile_visible !== 0 && (
                      <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded font-bold z-10">
                        #{visibleImages.indexOf(image) + 1}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        }
        return null;
      })()}

      <ImagePickerModal
        isOpen={showPicker}
        category="gallery"
        onSelect={handleSelectImage}
        onClose={() => {
          setShowPicker(false);
          setEditingImageId(null);
        }}
      />

      <ConfirmModal
        isOpen={showConfirmModal}
        onConfirm={confirmRemoveImage}
        onCancel={cancelRemoveImage}
        title="Clear Image"
        message="Are you sure you want to clear this image from the gallery? The position will remain empty and you can add a new image later."
        isLoading={isRemoving}
      />
    </section>
  );
}
