'use client';

import './services-styles.css';
import { useInView } from '../../hooks/useInView';
import { usePageContent } from '../../hooks/usePageContent';
import { useSectionImages } from '../../hooks/useSectionImages';
import { prepareHtml } from '../../utils/htmlUtils';

const AdPromoFilms = () => {
  const { content } = usePageContent();
  const { images } = useSectionImages();
  const [adContentRef, adContentInView] = useInView({ threshold: 0.5 });
  const [adImageRef, adImageInView] = useInView({ threshold: 0.5, delay: 150 });

  return (
    <section>
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
    </section>
  );
};

export default AdPromoFilms;
