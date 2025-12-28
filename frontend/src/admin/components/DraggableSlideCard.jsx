import { useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const ITEM_TYPE = 'SLIDE';

const POSITION_PRESETS = [
  { label: 'Center', value: 'center center' },
  { label: 'Top Center', value: 'center top' },
  { label: 'Bottom Center', value: 'center bottom' },
  { label: 'Left Center', value: 'left center' },
  { label: 'Right Center', value: 'right center' },
  { label: 'Top Left', value: 'left top' },
  { label: 'Top Right', value: 'right top' },
  { label: 'Bottom Left', value: 'left bottom' },
  { label: 'Bottom Right', value: 'right bottom' },
];

export default function DraggableSlideCard({ slide, index, moveSlide, onEdit, onDelete, onUpdate }) {
  const ref = useRef(null);
  const { showToast } = useToast();
  const [isEditingPosition, setIsEditingPosition] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('preset');
  const [customPosition, setCustomPosition] = useState(slide.object_position || 'center center');
  const [isSaving, setIsSaving] = useState(false);

  const [{ handlerId }, drop] = useDrop({
    accept: ITEM_TYPE,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const clientOffset = monitor.getClientOffset();

      // Get both horizontal and vertical positions
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2;
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      const hoverClientX = clientOffset.x - hoverBoundingRect.left;

      // Allow dragging in all directions (up, down, left, right)
      // Only swap when crossing the middle point in either direction
      if (dragIndex < hoverIndex) {
        // Dragging downwards or to the right
        if (hoverClientY < hoverMiddleY && hoverClientX < hoverMiddleX) {
          return;
        }
      }

      if (dragIndex > hoverIndex) {
        // Dragging upwards or to the left
        if (hoverClientY > hoverMiddleY && hoverClientX > hoverMiddleX) {
          return;
        }
      }

      moveSlide(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: () => {
      return { id: slide.id, index };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  const handleSavePosition = async () => {
    setIsSaving(true);
    try {
      const newPosition = selectedPreset === 'custom' ? customPosition : selectedPreset;
      await api.updateSliderPosition(slide.id, newPosition);
      showToast('Position updated successfully!', 'success');
      if (onUpdate) onUpdate();
      setIsEditingPosition(false);
    } catch (err) {
      showToast('Failed to update position', 'error');
      console.error('Failed to update position:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingPosition(false);
    setSelectedPreset('preset');
    setCustomPosition(slide.object_position || 'center center');
  };

  return (
    <div
      ref={ref}
      data-handler-id={handlerId}
      className={`bg-white rounded-lg shadow-md p-4 transition-all ${
        isDragging ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
      }`}
    >
      <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 mb-3">
        <img
          src={slide.cdn_url}
          alt={`Slide ${index + 1}`}
          className="w-full h-full object-cover"
          style={{ objectPosition: slide.object_position || 'center center' }}
        />
        <button
          onClick={onDelete}
          className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 hover:bg-red-700 transition-colors shadow-lg"
          title="Delete slide"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-gray-900">Slide {index + 1}</h4>
          <p className="text-xs text-gray-500 mt-0.5">{slide.filename}</p>
        </div>
        <button
          onClick={onEdit}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Change
        </button>
      </div>

      <div className="mt-2">
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-gray-600">Object Position:</label>
          {!isEditingPosition && (
            <button
              onClick={() => setIsEditingPosition(true)}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              Edit
            </button>
          )}
        </div>

        {!isEditingPosition ? (
          <p className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
            {slide.object_position || 'center center'}
          </p>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name={`position-type-${slide.id}`}
                  value="preset"
                  checked={selectedPreset === 'preset'}
                  onChange={(e) => setSelectedPreset(e.target.value)}
                  className="mr-1"
                />
                <span className="text-xs">Preset</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name={`position-type-${slide.id}`}
                  value="custom"
                  checked={selectedPreset === 'custom'}
                  onChange={(e) => setSelectedPreset(e.target.value)}
                  className="mr-1"
                />
                <span className="text-xs">Custom</span>
              </label>
            </div>

            {selectedPreset === 'preset' ? (
              <select
                value={customPosition}
                onChange={(e) => setCustomPosition(e.target.value)}
                className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {POSITION_PRESETS.map((preset) => (
                  <option key={preset.value} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={customPosition}
                onChange={(e) => setCustomPosition(e.target.value)}
                placeholder="e.g., 72% center"
                className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}

            <div className="flex gap-2">
              <button
                onClick={handleSavePosition}
                disabled={isSaving}
                className="flex-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="flex-1 px-2 py-1 text-xs bg-gray-400 text-white rounded hover:bg-gray-500 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
