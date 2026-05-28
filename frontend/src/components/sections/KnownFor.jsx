import './services-styles.css';
import { useInView } from '../../hooks/useInView';
import { usePageContent } from '../../hooks/usePageContent';
import { useSectionImages } from '../../hooks/useSectionImages';
import { prepareHtml } from '../../utils/htmlUtils';

const KnownFor = () => {
  const { content } = usePageContent();
  const { images } = useSectionImages();
  const [knownContentRef, knownContentInView] = useInView({ threshold: 0.5 });
  const [knownImageRef, knownImageInView] = useInView({ threshold: 0.5, delay: 150 });

  return (
    <section id="services">
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
    </section>
  );
};

export default KnownFor;
