import { useInView } from '../hooks/useInView';
import { usePageContent } from '../hooks/usePageContent';
import { useSectionImages } from '../hooks/useSectionImages';
import { prepareHtml } from '../utils/htmlUtils';

const Services = () => {
  const { content } = usePageContent();
  const { images } = useSectionImages();
  // We Are Known For - content and image
  const [knownContentRef, knownContentInView] = useInView({ threshold: 0.5 });
  const [knownImageRef, knownImageInView] = useInView({ threshold: 0.5, delay: 150 });

  // Event Coverage - title/image, content
  const [eventTitleRef, eventTitleInView] = useInView({ threshold: 0.5 });
  const [eventContentRef, eventContentInView] = useInView({ threshold: 0.5, delay: 150 });

  // Ad & Promo - content and image
  const [adContentRef, adContentInView] = useInView({ threshold: 0.5 });
  const [adImageRef, adImageInView] = useInView({ threshold: 0.5, delay: 150 });

  // Brand Coverage - content and image
  const [brandContentRef, brandContentInView] = useInView({ threshold: 0.5 });
  const [brandImageRef, brandImageInView] = useInView({ threshold: 0.5, delay: 150 });

  return (
    <>
      <style>{`
        .services-content ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        .services-content ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        .services-content li {
          margin: 0.25rem 0;
        }
        .services-content p {
          margin: 0.5rem 0;
        }
      `}</style>
      <section id="services" className="">
        {/* We Are Known For */}
      <div className="bg-white pt-8 pb-8 md:pt-12 md:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left - Text Content */}
            <div
              ref={knownContentRef}
              className={`will-animate ${knownContentInView ? 'animate-fade-up lg:animate-fade-right animation-complete' : ''}`}
            >
              <h2
                className="text-5xl md:text-6xl font-bold mb-8 text-center lg:text-left"
                dangerouslySetInnerHTML={prepareHtml(content?.services_known_for_title)}
              />
              <div
                className="text-base md:text-lg lg:text-xl font-medium mx-auto lg:mx-0 max-w-2xl lg:max-w-none services-content"
                style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}
                dangerouslySetInnerHTML={prepareHtml(content?.services_known_for_items)}
              />
            </div>

            {/* Right - Image */}
            <div
              ref={knownImageRef}
              className={`lg:order-last flex justify-center lg:justify-end will-animate ${knownImageInView ? 'animate-fade-up lg:animate-fade-left animation-complete' : ''}`}
            >
              <img
                src={images?.services_known_for?.url || 'https://r2.agileproductions.in/site-images/known-for.webp'}
                alt={images?.services_known_for?.alt || 'We Are Known For'}
                loading="lazy"
                width="800"
                height="600"
                className="w-full h-auto max-w-md md:max-w-xl lg:max-w-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Event Coverage */}
      <div className="bg-[#ECEDF0] pt-8 pb-8 md:pt-12 md:pb-16 lg:pb-24">
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

      {/* Additional Services Content */}
        {/* Ad & Promo Films */}
        <div className="bg-white pt-8 pb-8 md:pt-12 md:pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Content above image */}
            <div
              ref={adContentRef}
              className={`relative z-10 mb-2 will-animate ${adContentInView ? 'animate-fade-up lg:animate-fade-right animation-complete' : ''}`}
            >
              <h2
                className="text-5xl md:text-6xl font-bold mb-6 text-center lg:text-left"
                dangerouslySetInnerHTML={prepareHtml(content?.services_ad_films_title)}
              />
              <div
                className="text-base md:text-lg text-black leading-relaxed mb-8 max-w-3xl mx-auto lg:mx-0 md:pl-16 lg:pl-0 font-medium text-left services-content"
                style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}
                dangerouslySetInnerHTML={prepareHtml(content?.services_ad_films_description)}
              />
            </div>

            {/* Ad & Promo Collage - Image overlays bottom of text */}
            <div
              ref={adImageRef}
              className={`flex justify-center relative -mt-12 md:-mt-28 lg:-mt-40 will-animate ${adImageInView ? 'animate-fade-up lg:animate-fade-left animation-complete' : ''}`}
            >
              <img
                src={images?.services_ad_films?.url || 'https://r2.agileproductions.in/site-images/ad-promo.webp'}
                alt={images?.services_ad_films?.alt || 'Ad Films'}
                loading="lazy"
                width="1400"
                height="600"
                className="w-full h-auto max-w-6xl"
              />
            </div>
          </div>
        </div>

        {/* Brand Coverage */}
        <div className="bg-[#ECEDF0] pt-8 pb-8 md:pt-12 md:pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              ref={brandContentRef}
              className={`will-animate ${brandContentInView ? 'animate-fade-up lg:animate-fade-left animation-complete' : ''}`}
            >
              <h2
                className="text-5xl md:text-6xl font-bold mb-4 text-center lg:text-right"
                dangerouslySetInnerHTML={prepareHtml(content?.services_brand_coverage_title)}
              />
              <p
                className="text-base md:text-lg text-black leading-relaxed mb-6 lg:mb-10 max-w-3xl mx-auto lg:ml-auto lg:mr-0 font-medium text-center lg:text-right"
                style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}
                dangerouslySetInnerHTML={prepareHtml(content?.services_brand_coverage_description)}
              />
            </div>

            {/* Brand Coverage Image */}
            <div
              ref={brandImageRef}
              className={`flex justify-center will-animate ${brandImageInView ? 'animate-fade-up lg:animate-fade-right animation-complete' : ''}`}
            >
              <img
                src={images?.services_brand_coverage?.url || 'https://r2.agileproductions.in/site-images/brand-coverage-desktop.webp'}
                alt={images?.services_brand_coverage?.alt || 'Brand Coverage'}
                loading="lazy"
                width="1400"
                height="800"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Services;
