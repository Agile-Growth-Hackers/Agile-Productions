import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import ImagePickerModal from './ImagePickerModal';
import DraggableSlideCard from './DraggableSlideCard';

export default function SliderSection() {
  const { showToast } = useToast();
  const [slides, setSlides] = useState([]);
  const [originalOrder, setOriginalOrder] = useState([]); // Track original order
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [editingSlideId, setEditingSlideId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // { id: number, message: string }
  const [confirmSave, setConfirmSave] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchSlides();
  }, []);

  // Warn user about unsaved changes on page reload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Changes will be lost if you leave. Are you sure?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const fetchSlides = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getAdminSlider();
      setSlides(data);
      setOriginalOrder(data.map(slide => slide.id));
      setHasUnsavedChanges(false);
    } catch (err) {
      setError('Failed to load slider images');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const moveSlide = useCallback((dragIndex, hoverIndex) => {
    setSlides((prevSlides) => {
      const newSlides = [...prevSlides];
      const [draggedSlide] = newSlides.splice(dragIndex, 1);
      newSlides.splice(hoverIndex, 0, draggedSlide);

      // Check if order has changed
      const newOrder = newSlides.map(slide => slide.id);
      const orderChanged = JSON.stringify(newOrder) !== JSON.stringify(originalOrder);
      setHasUnsavedChanges(orderChanged);

      return newSlides;
    });
  }, [originalOrder]);

  const handleReorder = () => {
    setConfirmSave(true);
  };

  const confirmSaveAction = async () => {
    setIsSaving(true);
    try {
      const slideIds = slides.map(slide => slide.id);
      await api.reorderSlider(slideIds);
      setError('');
      // Refresh to get updated display_order from server
      await fetchSlides();
      showToast('Slide order saved successfully!', 'success');
      setConfirmSave(false);
    } catch (err) {
      setError('Failed to save new order');
      showToast(err.message || 'Failed to save new order', 'error');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSlide = () => {
    setEditingSlideId(null);
    setShowPicker(true);
  };

  const handleEditSlide = (slideId) => {
    setEditingSlideId(slideId);
    setShowPicker(true);
  };

  const handleSelectImage = async (selectedImage) => {
    try {
      if (editingSlideId) {
        // Update existing slide
        await api.updateSlider(editingSlideId, {
          r2_key: selectedImage.r2_key,
          cdn_url: selectedImage.cdn_url,
          filename: selectedImage.filename
        });
      } else {
        // Add new slide
        await api.addSlider({
          r2_key: selectedImage.r2_key,
          cdn_url: selectedImage.cdn_url,
          filename: selectedImage.filename,
          object_position: 'center center'
        });
      }
      await fetchSlides();
      setError('');
    } catch (err) {
      setError(editingSlideId ? 'Failed to update slide' : 'Failed to add slide');
      console.error(err);
    }
  };

  const handleDeleteSlide = (slideId) => {
    setConfirmDelete({
      id: slideId,
      message: 'Are you sure you want to delete this slide? Remaining slides will be auto-renumbered.'
    });
  };

  const confirmDeleteAction = async () => {
    setIsDeleting(true);
    try {
      await api.deleteSlider(confirmDelete.id);
      await fetchSlides();
      showToast('Slide deleted successfully!', 'error');
      setConfirmDelete(null);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to delete slide');
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Hero Slider</h2>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading slides...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
      <section className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Hero Slider</h2>
            <p className="text-sm text-gray-500 mt-1">
              Drag and drop to reorder slides
            </p>
          </div>
          <button
            onClick={handleAddSlide}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add New Slide</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {slides.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-600 mb-2">No slider images yet</p>
            <p className="text-sm text-gray-500">Click "Add New Slide" to get started</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {slides.map((slide, index) => (
                <DraggableSlideCard
                  key={slide.id}
                  slide={slide}
                  index={index}
                  moveSlide={moveSlide}
                  onEdit={() => handleEditSlide(slide.id)}
                  onDelete={() => handleDeleteSlide(slide.id)}
                />
              ))}
            </div>

            {slides.length > 1 && hasUnsavedChanges && (
              <button
                onClick={handleReorder}
                className="w-full mt-4 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                Save New Order
              </button>
            )}
          </>
        )}

        <ImagePickerModal
          isOpen={showPicker}
          category="slider"
          onSelect={handleSelectImage}
          onClose={() => setShowPicker(false)}
        />

        {/* Save Confirmation Modal */}
        {confirmSave && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Save New Order</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Are you sure you want to save the new slide order? This will update the order displayed on the public site.
                  </p>
                  <div className="flex items-center justify-end space-x-3">
                    <button
                      onClick={() => setConfirmSave(false)}
                      disabled={isSaving}
                      className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmSaveAction}
                      disabled={isSaving}
                      className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Save</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {confirmDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Delete</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {confirmDelete.message}
                  </p>
                  <div className="flex items-center justify-end space-x-3">
                    <button
                      onClick={() => setConfirmDelete(null)}
                      disabled={isDeleting}
                      className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDeleteAction}
                      disabled={isDeleting}
                      className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDeleting ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Deleting...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Delete</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
  );
}
