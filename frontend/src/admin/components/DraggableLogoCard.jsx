import { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';

const ITEM_TYPE = 'LOGO';

export default function DraggableLogoCard({ logo, index, moveLogo, selected, onToggleSelect, onDelete }) {
  const ref = useRef(null);

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

      moveLogo(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: () => {
      return { id: logo.id, index };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      data-handler-id={handlerId}
      className={`relative bg-white rounded-lg border-2 p-4 transition-all ${
        isDragging ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
      } ${
        selected ? 'border-blue-600 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Checkbox */}
      <div className="absolute top-2 left-2 z-10">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Delete Button */}
      <button
        onClick={onDelete}
        className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-colors z-10"
        title="Delete logo permanently"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>

      {/* Logo Image */}
      <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center p-2 mt-6">
        <img
          src={logo.cdn_url}
          alt={logo.alt_text || `Logo ${logo.id}`}
          className="max-w-full max-h-full object-contain"
        />
      </div>

      {/* Logo Info */}
      <div className="mt-2 text-center">
        <p className="text-xs text-gray-600 truncate" title={logo.filename}>
          {logo.alt_text || logo.filename}
        </p>
      </div>
    </div>
  );
}
