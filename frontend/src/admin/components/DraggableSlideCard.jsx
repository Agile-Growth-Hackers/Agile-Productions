import { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';

const ITEM_TYPE = 'SLIDE';

export default function DraggableSlideCard({ slide, index, moveSlide, onEdit, onDelete }) {
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
        <label className="text-xs text-gray-600 block mb-1">Object Position:</label>
        <p className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
          {slide.object_position || 'center center'}
        </p>
      </div>
    </div>
  );
}
