'use client';

import { useInView } from '../../hooks/useInView';
import { usePageContent } from '../../hooks/usePageContent';
import { useSectionImages } from '../../hooks/useSectionImages';
import { prepareHtml } from '../../utils/htmlUtils';

const EventCoverage = () => {
  const { content } = usePageContent();
  const { images } = useSectionImages();
  const [eventTitleRef, eventTitleInView] = useInView({ threshold: 0.5 });
  const [eventContentRef, eventContentInView] = useInView({ threshold: 0.5, delay: 150 });

  return (
    <section>
      <div className="bg-white pt-8 pb-8 md:pt-12 md:pb-16 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile/Tablet: Show title above content */}
          <h2
            ref={eventTitleRef}
            className={`text-5xl md:text-6xl font-bold mb-6 text-center lg:hidden will-animate ${eventTitleInView ? 'animate-fade-up animation-complete' : ''}`}
            dangerouslySetInnerHTML={prepareHtml(content?.services_event_coverage_title)}
          />

          {/* Desktop: Image with overlaid title shown first */}
          <div
            ref={eventTitleRef}
            className={`hidden lg:block relative mb-5 w-[80%] will-animate ${eventTitleInView ? 'animate-fade-left animation-complete' : ''}`}
          >
            <img
              src={images?.services_event_coverage?.url || 'https://r2.agileproductions.in/site-images/event-coverage.webp'}
              alt={images?.services_event_coverage?.alt || 'Event Coverage'}
              loading="lazy"
              width="1200"
              height="800"
              className="w-full h-auto"
            />
            <h2
              className="absolute top-[35%] left-[85%] -translate-y-1/2 text-5xl md:text-6xl font-bold text-black"
              dangerouslySetInnerHTML={prepareHtml(content?.services_event_coverage_title)}
            />
          </div>

          {/* Content */}
          <div
            ref={eventContentRef}
            className={`max-w-4xl mx-auto xl:mx-0 text-center xl:text-left mb-6 xl:mb-0 will-animate ${eventContentInView ? 'animate-fade-up lg:animate-fade-right animation-complete' : ''}`}
          >
            <p
              className="text-base md:text-lg text-black leading-relaxed mb-8 font-medium"
              style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}
              dangerouslySetInnerHTML={prepareHtml(content?.services_event_coverage_description)}
            />
          </div>

          {/* Mobile/Tablet: Image shown after content */}
          <div
            ref={eventContentRef}
            className={`lg:hidden flex justify-center mt-6 will-animate ${eventContentInView ? 'animate-fade-up animation-complete' : ''}`}
          >
            <img
              src={images?.services_event_coverage?.url || 'https://r2.agileproductions.in/site-images/event-coverage.webp'}
              alt={images?.services_event_coverage?.alt || 'Event Coverage'}
              loading="lazy"
              width="1200"
              height="800"
              className="w-full h-auto max-w-md md:max-w-2xl"
            />
          </div>

        </div>
      </div>
    </section>
  );
};

export default EventCoverage;
