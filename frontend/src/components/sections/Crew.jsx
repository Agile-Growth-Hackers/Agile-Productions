'use client';

import { useInView } from '../../hooks/useInView';
import { usePageContent } from '../../hooks/usePageContent';
import { useSectionImages } from '../../hooks/useSectionImages';
import { prepareHtml, stripHtmlTags } from '../../utils/htmlUtils';
import sectionImageUrls from '../../data/sectionImageUrls.generated.json';

const CREW_ROLES_FALLBACK =
  '<ul><li>Race Photographers</li><li>Cinematographers</li><li>FPV/DRONE Pilot</li><li>Video Editors</li><li>Project Managers</li><li>Social Media Managers</li><li>Graphics Designers</li></ul>';

const Crew = () => {
  const { content } = usePageContent();
  const { images } = useSectionImages();

  const [leftRef, leftInView] = useInView({ threshold: 0.3 });
  const [rightRef, rightInView] = useInView({ threshold: 0.3, delay: 150 });

  const crewImageUrl = images?.crew_image?.url || (sectionImageUrls?.crew || null);
  const crewImageAlt = images?.crew_image?.alt || 'Crew';

  const crewAccentUrl = images?.crew_accent?.url || (sectionImageUrls?.crew_accent || null);
  const crewAccentAlt = images?.crew_accent?.alt || 'Crew accent';

  return (
    <>
      <style>{`
        .crew-content ul {
          list-style-type: none;
          padding-left: 0;
          margin: 1rem 0;
        }
        .crew-content ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin: 1rem 0;
        }
        .crew-content li {
          margin: 0.75rem 0;
          line-height: 1.75;
          display: flex;
          align-items: flex-start;
          position: relative;
          padding-left: 1.5rem;
        }
        .crew-content li::before {
          content: "•";
          position: absolute;
          left: 0;
          top: 0.1em;
          font-size: 1.5rem;
          line-height: 1;
        }
        .crew-content p {
          margin: 1.5rem 0;
          line-height: 1.75;
        }
        .crew-content p:first-child {
          margin-top: 0;
        }
      `}</style>
      <section id="crew" className="bg-white py-12 md:py-16 overflow-hidden">
        {/* Desktop layout: small accent (flush to container left edge) | content | main image */}
        <div className="hidden md:grid md:grid-cols-12 gap-6 lg:gap-8 items-stretch max-w-7xl mx-auto pr-4 sm:pr-6 lg:pr-8">
          {/* Far-left small accent — extends from screen edge, hidden on ultrawide */}
          <div
            ref={leftRef}
            className={`md:col-span-2 2xl:hidden flex items-end pb-[92px] will-animate ${leftInView ? 'animate-fade-up animation-complete' : ''}`}
          >
            {crewAccentUrl ? (
              <img
                src={crewAccentUrl}
                alt={crewAccentAlt}
                loading="lazy"
                width="320"
                height="240"
                className="w-full max-w-[100px] h-[220px] rounded-r-3xl object-cover"
              />
            ) : (
              <div
                data-placeholder="crew-accent"
                className="w-full border-2 border-dashed border-gray-300 rounded-r-3xl aspect-[4/3] flex items-center justify-center bg-gray-50"
              >
                <p className="text-gray-400 text-xs md:text-sm text-center px-3">Accent image — coming soon</p>
              </div>
            )}
          </div>

          {/* Middle content — title + roles */}
          <div className="md:col-span-3 2xl:col-span-4 px-4 md:px-0">
            <h2 className="text-5xl md:text-6xl font-bold text-left mb-8">
              {stripHtmlTags(content?.crew_title) || 'CREW'}
            </h2>
            <div
              className="text-base md:text-lg text-black font-medium crew-content"
              style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}
              dangerouslySetInnerHTML={prepareHtml(content?.crew_roles, CREW_ROLES_FALLBACK)}
            />
          </div>

          {/* Right main image */}
          <div
            ref={rightRef}
            className={`md:col-span-7 2xl:col-span-8 flex items-center will-animate ${rightInView ? 'animate-fade-up animation-complete' : ''}`}
          >
            {crewImageUrl ? (
              <img
                src={crewImageUrl}
                alt={crewImageAlt}
                loading="lazy"
                width="800"
                height="500"
                className="w-full h-full max-h-[600px] rounded-3xl object-cover"
              />
            ) : (
              <div
                data-placeholder="crew"
                className="w-full border-2 border-dashed border-gray-300 rounded-3xl aspect-video flex items-center justify-center bg-gray-50"
              >
                <p className="text-gray-400 text-sm md:text-base">Crew photo — image coming soon</p>
              </div>
            )}
          </div>
        </div>

        {/* Mobile layout: content, then main image below */}
        <div className="md:hidden max-w-7xl mx-auto px-4 sm:px-6">
          <div
            ref={leftRef}
            className={`will-animate ${leftInView ? 'animate-fade-up animation-complete' : ''}`}
          >
            <h2 className="text-5xl font-bold text-left mb-8">
              {stripHtmlTags(content?.crew_title) || 'CREW'}
            </h2>
            <div
              className="text-base text-black font-medium crew-content"
              style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}
              dangerouslySetInnerHTML={prepareHtml(content?.crew_roles, CREW_ROLES_FALLBACK)}
            />
          </div>
          <div
            ref={rightRef}
            className={`mt-8 will-animate ${rightInView ? 'animate-fade-up animation-complete' : ''}`}
          >
            {crewImageUrl ? (
              <img
                src={crewImageUrl}
                alt={crewImageAlt}
                loading="lazy"
                width="800"
                height="500"
                className="w-full h-auto rounded-3xl object-cover"
              />
            ) : (
              <div
                data-placeholder="crew"
                className="border-2 border-dashed border-gray-300 rounded-3xl aspect-video flex items-center justify-center bg-gray-50"
              >
                <p className="text-gray-400 text-sm">Crew photo — image coming soon</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default Crew;
