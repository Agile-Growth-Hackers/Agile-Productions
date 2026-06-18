'use client';

import { useInView } from '../../hooks/useInView';
import { usePageContent } from '../../hooks/usePageContent';
import { useSectionImages } from '../../hooks/useSectionImages';
import { prepareHtml } from '../../utils/htmlUtils';

const BrandCoverage = () => {
  const { content } = usePageContent();
  const { images } = useSectionImages();
  const [brandContentRef, brandContentInView] = useInView({ threshold: 0.5 });
  const [brandImageRef, brandImageInView] = useInView({ threshold: 0.5, delay: 150 });

  return (
    <section>
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
  );
};

export default BrandCoverage;
