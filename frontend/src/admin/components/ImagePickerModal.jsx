import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function ImagePickerModal({ isOpen, category, onSelect, onClose, excludeR2Keys = [] }) {
  const { showToast } = useToast();
  const [storageImages, setStorageImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState(''); // 'uploading', 'converting', 'ready'
  const [error, setError] = useState('');
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [justUploadedIds, setJustUploadedIds] = useState(new Set());
  const [checkedImages, setCheckedImages] = useState(new Set());
  const [showMenuForId, setShowMenuForId] = useState(null);
  const [renamingImage, setRenamingImage] = useState(null);
  const [newFilename, setNewFilename] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null); // { type: 'single' | 'multiple', id?: number, message: string }
  const [isDeleting, setIsDeleting] = useState(false);
  const [webpQuality, setWebpQuality] = useState(90); // WebP quality: 0-100

  // Filter out images that are already in use
  const availableImages = storageImages.filter(img => !excludeR2Keys.includes(img.r2_key));

  useEffect(() => {
    if (isOpen && category) {
      fetchStorageImages();
    }
  }, [isOpen, category]);

  const fetchStorageImages = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getStorageImages(category);
      setStorageImages(data);
    } catch (err) {
      setError('Failed to load images from storage');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Convert image to WebP with quality setting and resize to reasonable dimensions
  const convertToWebP = async (file, quality) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        img.onload = () => {
          // Calculate resized dimensions (max 2000px width for gallery, maintain aspect ratio)
          const MAX_WIDTH = 2000;
          const MAX_HEIGHT = 2000;

          let width = img.width;
          let height = img.height;

          // Only resize if image is larger than max dimensions
          if (width > MAX_WIDTH || height > MAX_HEIGHT) {
            const aspectRatio = width / height;

            if (width > height) {
              width = MAX_WIDTH;
              height = Math.round(MAX_WIDTH / aspectRatio);
            } else {
              height = MAX_HEIGHT;
              width = Math.round(MAX_HEIGHT * aspectRatio);
            }
          }

          // Create canvas with resized dimensions
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          // Draw image to canvas (resized)
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to WebP blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                // Create new File object with .webp extension
                const originalName = file.name.replace(/\.[^.]+$/, '');
                const webpFile = new File([blob], `${originalName}.webp`, {
                  type: 'image/webp',
                  lastModified: Date.now(),
                });
                resolve({
                  file: webpFile,
                  originalSize: file.size,
                  compressedSize: blob.size,
                  compressionRatio: ((1 - blob.size / file.size) * 100).toFixed(1),
                  originalDimensions: `${img.width}x${img.height}`,
                  newDimensions: `${width}x${height}`
                });
              } else {
                reject(new Error('Failed to convert image'));
              }
            },
            'image/webp',
            quality / 100 // Convert 0-100 to 0-1
          );
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target.result;
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate all files
    const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      setError('Please select only valid image files');
      return;
    }

    // Increased limit to 30MB since we'll compress them
    const oversizedFiles = files.filter(file => file.size > 30 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError(`${oversizedFiles.length} file(s) exceed 30MB limit`);
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadStage(`converting`);
    setError('');
    setJustUploadedIds(new Set());

    const uploadedImages = [];
    let successCount = 0;
    let failCount = 0;
    let totalSaved = 0;

    try {
      // Convert and upload files one by one
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Convert to WebP
        setUploadStage(`converting ${i + 1}/${files.length}`);
        setUploadProgress(0);

        try {
          const converted = await convertToWebP(file, webpQuality);
          const webpFile = converted.file;
          totalSaved += (converted.originalSize - converted.compressedSize);

          // Upload to storage
          setUploadStage(`uploading ${i + 1}/${files.length}`);

          // Simulate progress for individual file
          const progressInterval = setInterval(() => {
            setUploadProgress(prev => {
              if (prev >= 90) {
                clearInterval(progressInterval);
                return 90;
              }
              return prev + 10;
            });
          }, 100);

          const newImage = await api.uploadStorage(webpFile, category);
          clearInterval(progressInterval);
          setUploadProgress(100);

          // Small delay to show 100% before moving to next file
          await new Promise(resolve => setTimeout(resolve, 200));

          uploadedImages.push(newImage);
          successCount++;
        } catch (err) {
          console.error(`Failed to process ${file.name}:`, err);
          failCount++;
        }
      }

      // Show converting stage
      setUploadProgress(95);
      setUploadStage('converting');

      // Simulate conversion time (small delay for UI feedback)
      await new Promise(resolve => setTimeout(resolve, 500));

      // Complete
      setUploadProgress(100);
      setUploadStage('ready');

      // Add all uploaded images to storage list
      setStorageImages(prev => [...uploadedImages, ...prev]);

      // Auto-select the first newly uploaded image and mark all as new
      if (uploadedImages.length > 0) {
        setSelectedImageId(uploadedImages[0].id);
        setJustUploadedIds(new Set(uploadedImages.map(img => img.id)));
      }

      setError('');

      // Show success toast with count and compression stats
      const savedMB = (totalSaved / (1024 * 1024)).toFixed(1);
      if (successCount > 0 && failCount === 0) {
        showToast(`${successCount} image(s) uploaded! Saved ${savedMB}MB with WebP compression`, 'success');
      } else if (successCount > 0 && failCount > 0) {
        showToast(`${successCount} uploaded, ${failCount} failed. Saved ${savedMB}MB`, 'success');
      } else {
        showToast(`Failed to upload images`, 'error');
      }

      // Clear success state after 3 seconds
      setTimeout(() => {
        setUploadStage('');
        setUploadProgress(0);
      }, 3000);

      // Reset file input
      e.target.value = '';
    } catch (err) {
      setError(err.message || 'Failed to upload images');
      console.error(err);
      setUploadStage('');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleSelectImage = () => {
    const selectedImage = storageImages.find(img => img.id === selectedImageId);
    if (selectedImage) {
      onSelect(selectedImage);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedImageId(null);
    setCheckedImages(new Set());
    setShowMenuForId(null);
    setRenamingImage(null);
    setError('');
    onClose();
  };

  const handleCheckboxChange = (imageId) => {
    const newChecked = new Set(checkedImages);
    if (newChecked.has(imageId)) {
      newChecked.delete(imageId);
    } else {
      newChecked.add(imageId);
    }
    setCheckedImages(newChecked);
  };

  const handleCopyLink = (cdnUrl) => {
    navigator.clipboard.writeText(cdnUrl);
    setError('');
    setShowMenuForId(null);
    showToast('Link copied to clipboard!', 'success');
  };

  const handleDownload = (image) => {
    setShowMenuForId(null);

    // Use backend download endpoint that sets proper headers
    const downloadUrl = api.getDownloadUrl(image.r2_key);

    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = image.filename || 'download.webp';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    showToast('Download started!', 'success');
  };

  const handleDeleteSingle = (imageId) => {
    setConfirmDelete({
      type: 'single',
      id: imageId,
      message: 'Are you sure you want to delete this image? This cannot be undone.'
    });
    setShowMenuForId(null);
  };

  const handleDeleteMultiple = () => {
    if (checkedImages.size === 0) return;

    setConfirmDelete({
      type: 'multiple',
      message: `Are you sure you want to delete ${checkedImages.size} image(s)? This cannot be undone.`
    });
  };

  const confirmDeleteAction = async () => {
    setIsDeleting(true);
    try {
      if (confirmDelete.type === 'single') {
        await api.deleteStorageImage(confirmDelete.id);
        setStorageImages(prev => prev.filter(img => img.id !== confirmDelete.id));
        showToast('Image deleted successfully!', 'error');
      } else if (confirmDelete.type === 'multiple') {
        for (const imageId of checkedImages) {
          await api.deleteStorageImage(imageId);
        }
        setStorageImages(prev => prev.filter(img => !checkedImages.has(img.id)));
        setCheckedImages(new Set());
        showToast(`${checkedImages.size} image(s) deleted successfully!`, 'error');
      }
      setConfirmDelete(null);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to delete image');
      setConfirmDelete(null);
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStartRename = (image) => {
    setRenamingImage(image);
    setNewFilename(image.filename.replace(/\.(webp|png|jpg|jpeg)$/i, ''));
    setShowMenuForId(null);
  };

  const handleRename = async () => {
    if (!newFilename.trim() || !renamingImage) return;

    try {
      const extension = renamingImage.filename.match(/\.(webp|png|jpg|jpeg)$/i)?.[0] || '.webp';
      const fullFilename = newFilename.trim() + extension;

      await api.renameStorageImage(renamingImage.id, fullFilename);

      setStorageImages(prev => prev.map(img =>
        img.id === renamingImage.id
          ? { ...img, filename: fullFilename }
          : img
      ));

      setRenamingImage(null);
      setNewFilename('');
      setError('');
    } catch (err) {
      setError('Failed to rename image');
      console.error(err);
    }
  };

  if (!isOpen) return null;

  const categoryLabels = {
    'slider': 'Slider Images',
    'gallery': 'Gallery Images',
    'logos/client': 'Client Logos'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-xl font-bold text-gray-900">
              Select Image - {categoryLabels[category] || category}
            </h3>
            {checkedImages.size > 0 && (
              <button
                onClick={handleDeleteMultiple}
                className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Delete {checkedImages.size}</span>
              </button>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Upload Section */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <label className="flex items-center justify-center w-full">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              uploading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
            } text-white`}>
              {uploading ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              )}
              <span className="font-medium">
                {uploading ? (
                  uploadStage.startsWith('uploading') ? uploadStage.charAt(0).toUpperCase() + uploadStage.slice(1) :
                  uploadStage === 'converting' ? 'Converting to WebP...' :
                  uploadStage === 'ready' ? 'Ready!' : 'Processing...'
                ) : 'Upload Images'}
              </span>
            </div>
          </label>

          {/* Progress Bar */}
          {uploading && (
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    uploadStage === 'ready' ? 'bg-green-600' : 'bg-blue-600'
                  }`}
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-600 text-center mt-1">
                {uploadStage === 'uploading' && `Uploading... ${uploadProgress}%`}
                {uploadStage === 'converting' && 'Converting to WebP format...'}
                {uploadStage === 'ready' && '✓ Upload complete! Image ready to select.'}
              </p>
            </div>
          )}

          {/* WebP Quality Slider */}
          {!uploading && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  WebP Quality: {webpQuality}%
                </label>
                <span className={`text-xs font-semibold ${
                  webpQuality >= 90 ? 'text-green-600' :
                  webpQuality >= 85 ? 'text-blue-600' :
                  webpQuality >= 80 ? 'text-yellow-600' :
                  'text-orange-600'
                }`}>
                  {webpQuality >= 90 ? 'Highest' : webpQuality >= 85 ? 'High' : webpQuality >= 80 ? 'Good' : webpQuality >= 70 ? 'Medium' : 'Low'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={webpQuality}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setWebpQuality(Math.max(70, value)); // Enforce minimum of 70
                }}
                className="w-full cursor-pointer webp-quality-slider"
                style={{
                  background: `linear-gradient(to right, #93c5fd 0%, #93c5fd 70%, #2563eb 70%, #2563eb ${webpQuality}%, #e5e7eb ${webpQuality}%, #e5e7eb 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Smaller file (70%)</span>
                <span>Best quality (100%)</span>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                💡 Recommended: 90% for web display. Higher = better quality, larger files.
              </p>
            </div>
          )}

          {/* Success notification */}
          {uploadStage === 'ready' && !uploading && (
            <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700 text-center font-medium">
                ✓ Image uploaded and converted successfully! You can now select it below.
              </p>
            </div>
          )}

          {category === 'logos/client' && !uploading && (
            <p className="text-sm text-gray-500 text-center mt-2">
              Recommended: 400x400px or higher, square format
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Image Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading images...</p>
              </div>
            </div>
          ) : availableImages.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500">{storageImages.length === 0 ? 'No images in storage yet' : 'All images are already in use'}</p>
                <p className="text-sm text-gray-400 mt-1">{storageImages.length === 0 ? 'Upload your first image to get started' : 'Upload a new image or remove some logos from the list'}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {availableImages.map((image) => (
                <div
                  key={image.r2_key}
                  className={`group relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImageId === image.id
                      ? 'border-blue-600 ring-2 ring-blue-200'
                      : justUploadedIds.has(image.id)
                      ? 'border-green-500 ring-2 ring-green-200'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${category === 'logos/client' ? 'bg-white' : 'bg-gray-100'}`}
                >
                  {/* Image */}
                  <button
                    onClick={() => setSelectedImageId(image.id)}
                    className="w-full h-full"
                  >
                    <img
                      src={image.cdn_url}
                      alt={image.filename}
                      loading="lazy"
                      className={`w-full h-full ${
                        category === 'logos/client'
                          ? 'object-contain p-2'
                          : 'object-cover'
                      }`}
                    />
                  </button>

                  {/* Overlay */}
                  <div className={`absolute inset-0 bg-blue-600 transition-opacity pointer-events-none ${
                    selectedImageId === image.id ? 'opacity-10' : 'opacity-0 group-hover:opacity-5'
                  }`}></div>

                  {/* Checkbox - Top Left */}
                  <div
                    className="absolute top-2 left-2 z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={checkedImages.has(image.id)}
                      onChange={() => handleCheckboxChange(image.id)}
                      className="w-5 h-5 text-blue-600 border-2 border-white rounded shadow-lg cursor-pointer"
                    />
                  </div>

                  {/* NEW Badge - Bottom Right */}
                  {justUploadedIds.has(image.id) && (
                    <div className="absolute bottom-2 right-2 z-10 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                      NEW
                    </div>
                  )}

                  {/* Selected Checkmark - Top Right */}
                  {selectedImageId === image.id && (
                    <div className="absolute top-2 right-2 z-10 bg-blue-600 text-white rounded-full p-1 shadow-lg">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}

                  {/* Three-dot Menu - Top Right */}
                  <div className="absolute top-2 right-2 z-10">
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenuForId(showMenuForId === image.id ? null : image.id);
                        }}
                        className="bg-white/90 hover:bg-white text-gray-700 rounded-full p-1.5 shadow-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>

                      {/* Dropdown Menu */}
                      {showMenuForId === image.id && (
                        <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-20">
                          <button
                            onClick={() => handleCopyLink(image.cdn_url)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span>Copy Link</span>
                          </button>
                          <button
                            onClick={() => handleDownload(image)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span>Download</span>
                          </button>
                          <button
                            onClick={() => handleStartRename(image)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>Rename</span>
                          </button>
                          <hr className="my-1" />
                          <button
                            onClick={() => handleDeleteSingle(image.id)}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Filename */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 pointer-events-none">
                    <p className="text-xs text-white truncate">{image.filename}</p>
                    {image.width && image.height && (
                      <p className="text-xs text-gray-300">{image.width} × {image.height}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end space-x-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSelectImage}
            disabled={!selectedImageId}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Select Image
          </button>
        </div>
      </div>

      {/* Rename Modal */}
      {renamingImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Rename Image</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filename (without extension)
              </label>
              <input
                type="text"
                value={newFilename}
                onChange={(e) => setNewFilename(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename();
                  if (e.key === 'Escape') setRenamingImage(null);
                }}
                autoFocus
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter new filename"
              />
              <p className="mt-1 text-xs text-gray-500">
                Extension will be automatically added: {renamingImage.filename.match(/\.(webp|png|jpg|jpeg)$/i)?.[0] || '.webp'}
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setRenamingImage(null)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRename}
                disabled={!newFilename.trim()}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Rename
              </button>
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
    </div>
  );
}
