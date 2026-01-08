import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useRegion } from '../../context/RegionContext';
import ImagePickerModal from './ImagePickerModal';
import DraggableLogoCard from './DraggableLogoCard';
import * as FlagIcons from 'country-flag-icons/react/3x2';

export default function LogosSection() {
  const { showToast } = useToast();
  const { selectedRegion } = useRegion();
  const [logos, setLogos] = useState([]);
  const [originalOrder, setOriginalOrder] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); // { action: string, ids: number[], message: string }
  const [confirmSave, setConfirmSave] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchLogos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getAdminLogos(selectedRegion);
      // Only show active logos
      const activeLogos = data.filter(logo => logo.is_active);
      setLogos(activeLogos);
      setOriginalOrder(activeLogos.map(logo => logo.id));
      setHasUnsavedChanges(false);
      setSelectedIds([]);
    } catch (err) {
      setError('Failed to load logos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedRegion]);

  useEffect(() => {
    if (selectedRegion) {
      fetchLogos();
    }
  }, [selectedRegion, fetchLogos]);

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

  const moveLogo = useCallback((dragIndex, hoverIndex) => {
    setLogos((prevLogos) => {
      const newLogos = [...prevLogos];
      const [draggedLogo] = newLogos.splice(dragIndex, 1);
      newLogos.splice(hoverIndex, 0, draggedLogo);

      // Check if order has changed
      const newOrder = newLogos.map(logo => logo.id);
      const orderChanged = JSON.stringify(newOrder) !== JSON.stringify(originalOrder);
      setHasUnsavedChanges(orderChanged);

      return newLogos;
    });
  }, [originalOrder]);

  const handleReorder = () => {
    setConfirmSave(true);
  };

  const confirmSaveAction = async () => {
    setIsSaving(true);
    try {
      const logoIds = logos.map(logo => logo.id);
      await api.reorderLogos(logoIds, selectedRegion);
      setError('');
      await fetchLogos();
      showToast('Logo order saved successfully!', 'success');
      setConfirmSave(false);
    } catch (err) {
      setError('Failed to save new order');
      showToast(err.message || 'Failed to save new order', 'error');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleSelect = (logoId) => {
    setSelectedIds(prev =>
      prev.includes(logoId)
        ? prev.filter(id => id !== logoId)
        : [...prev, logoId]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === logos.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(logos.map(logo => logo.id));
    }
  };

  const handleAddLogo = () => {
    setShowPicker(true);
  };

  const handleSelectImage = async (selectedImage) => {
    try {
      await api.addLogo({
        r2_key: selectedImage.r2_key,
        cdn_url: selectedImage.cdn_url,
        cdn_url_mobile: selectedImage.cdn_url_mobile,
        filename: selectedImage.filename,
        alt_text: selectedImage.filename.replace(/\.(webp|png|jpg|jpeg)$/i, '')
      }, selectedRegion);
      setShowPicker(false);
      await fetchLogos();
      setError('');
      showToast('Logo added successfully!', 'success');
    } catch (err) {
      const errorMessage = err.message || 'Failed to add logo';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      console.error(err);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;

    setConfirmDelete({
      action: 'delete-selected',
      ids: selectedIds,
      message: `Are you sure you want to permanently delete ${selectedIds.length} logo(s)? This action cannot be undone.`
    });
  };

  const handleRemoveFromList = () => {
    if (selectedIds.length === 0) return;

    setConfirmDelete({
      action: 'remove-from-list',
      ids: selectedIds,
      message: `Remove ${selectedIds.length} logo(s) from the active list? They will be kept in storage and can be re-added later.`
    });
  };

  const handleDeleteLogo = (logoId) => {
    setConfirmDelete({
      action: 'delete-single',
      ids: [logoId],
      message: 'Are you sure you want to permanently delete this logo? This action cannot be undone.'
    });
  };

  const confirmDeleteAction = async () => {
    setIsDeleting(true);
    try {
      switch (confirmDelete.action) {
        case 'delete-selected':
          await api.deleteMultipleLogos(confirmDelete.ids, selectedRegion);
          showToast(`${confirmDelete.ids.length} logo(s) deleted successfully!`, 'error');
          break;
        case 'remove-from-list':
          await api.deactivateLogos(confirmDelete.ids, selectedRegion);
          showToast(`${confirmDelete.ids.length} logo(s) removed from list!`, 'error');
          break;
        case 'delete-single':
          await api.deleteLogo(confirmDelete.ids[0], selectedRegion);
          showToast('Logo deleted successfully!', 'error');
          break;
      }
      await fetchLogos();
      setConfirmDelete(null);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to complete action');
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Client Logos</h2>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading logos...</p>
          </div>
        </div>
      </section>
    );
  }

  const FlagIcon = FlagIcons[selectedRegion];

  return (
      <section className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-gray-900">Client Logos</h2>
              {FlagIcon && <FlagIcon className="w-6 h-4" title={selectedRegion} />}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Drag and drop to reorder • {selectedIds.length} selected
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            onClick={handleAddLogo}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Upload New Logo</span>
          </button>

          {logos.length > 0 && (
            <>
              <button
                onClick={handleSelectAll}
                className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                {selectedIds.length === logos.length ? 'Deselect All' : 'Select All'}
              </button>

              <button
                onClick={handleRemoveFromList}
                disabled={selectedIds.length === 0}
                className="px-4 py-2 bg-yellow-600 text-white font-medium rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Remove from List ({selectedIds.length})
              </button>

              <button
                onClick={handleDeleteSelected}
                disabled={selectedIds.length === 0}
                className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete Selected ({selectedIds.length})
              </button>
            </>
          )}
        </div>

        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Recommended:</strong> 400x400px or higher, square format for best results
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {logos.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-600 mb-2">No client logos yet</p>
            <p className="text-sm text-gray-500">Click "Upload New Logo" to get started</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 mb-4">
              {logos.map((logo, index) => (
                <DraggableLogoCard
                  key={logo.id}
                  logo={logo}
                  index={index}
                  moveLogo={moveLogo}
                  selected={selectedIds.includes(logo.id)}
                  onToggleSelect={() => handleToggleSelect(logo.id)}
                  onDelete={() => handleDeleteLogo(logo.id)}
                />
              ))}
            </div>

            {logos.length > 1 && hasUnsavedChanges && (
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
          category="logos/client"
          onSelect={handleSelectImage}
          onClose={() => setShowPicker(false)}
          excludeR2Keys={logos.map(logo => logo.r2_key)}
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
                    Are you sure you want to save the new logo order? This will update the order displayed on the public site.
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
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Action</h3>
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
                      className={`px-4 py-2 text-white font-medium rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                        confirmDelete.action === 'remove-from-list'
                          ? 'bg-yellow-600 hover:bg-yellow-700'
                          : 'bg-red-600 hover:bg-red-700'
                      }`}
                    >
                      {isDeleting ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>
                            {confirmDelete.action === 'remove-from-list' ? 'Removing...' : 'Deleting...'}
                          </span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>
                            {confirmDelete.action === 'remove-from-list' ? 'Remove' : 'Delete'}
                          </span>
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
