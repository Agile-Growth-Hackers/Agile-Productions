'use client';

import { useInView } from '../../hooks/useInView';
import { usePageContent } from '../../hooks/usePageContent';
import { useSectionImages } from '../../hooks/useSectionImages';
import { prepareHtml, stripHtmlTags } from '../../utils/htmlUtils';
import sectionImageUrls from '../../data/sectionImageUrls.generated.json';

const DESCRIPTION_FALLBACK =
  'We capture the most important moment in ownership — vehicle delivery. From unveil to handover, we turn emotion and pride into timeless brand visuals for social media and advertising.';

const VehicleDelivery = () => {
  const { content } = usePageContent();
  const { images } = useSectionImages();

  const [textRef, textInView] = useInView({ threshold: 0.3 });
  const [imageRef, imageInView] = useInView({ threshold: 0.2, delay: 150 });

  const collageUrl =
    images?.vehicle_delivery_collage?.url ||
    sectionImageUrls?.vehicle_delivery_collage ||
    null;
  const collageAlt = images?.vehicle_delivery_collage?.alt || 'Vehicle Delivery';

  return (
    <section id="vehicle-delivery" className="bg-[#ECEDF0] py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Text cluster */}
        <div
          ref={textRef}
          className={`will-animate ${textInView ? 'animate-fade-up animation-complete' : ''}`}
        >
          <p
            className="text-xs md:text-sm tracking-widest text-black font-medium mb-4 uppercase"
            style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}
          >
            {stripHtmlTags(content?.vehicle_delivery_eyebrow) || 'CAPTURING THE MOMENT THAT MATTERS'}
          </p>
          <h2 className="text-5xl md:text-6xl font-bold">
            {stripHtmlTags(content?.vehicle_delivery_title) || 'VEHICLE DELIVERY'}
          </h2>
          <div
            className="text-base md:text-lg text-black font-medium leading-relaxed max-w-2xl mt-6"
            style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}
            dangerouslySetInnerHTML={prepareHtml(content?.vehicle_delivery_description, DESCRIPTION_FALLBACK)}
          />
        </div>

        {/* Image area — overlaps bottom of text like Ad & Promo Films */}
        <div
          ref={imageRef}
          className={`relative -mt-6 md:-mt-16 lg:-mt-20 will-animate ${imageInView ? 'animate-fade-up animation-complete' : ''}`}
        >
          {collageUrl ? (
            <img
              src={collageUrl}
              alt={collageAlt}
              loading="lazy"
              width="1600"
              height="682"
              className="w-full rounded-3xl"
            />
          ) : (
            <div
              data-placeholder="vehicle-delivery"
              className="border-2 border-dashed border-gray-400 rounded-3xl aspect-video flex items-center justify-center bg-white/40"
            >
              <p className="text-gray-500 text-sm md:text-base">Vehicle delivery collage — image coming soon</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default VehicleDelivery;
