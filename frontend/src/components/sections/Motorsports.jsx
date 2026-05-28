import { useState } from 'react';
import { useInView } from '../../hooks/useInView';
import { usePageContent } from '../../hooks/usePageContent';
import { prepareHtml, stripHtmlTags } from '../../utils/htmlUtils';
import motorsportsData from '../../data/sectionImageUrls.generated.json';

const FOOTER_FALLBACK =
  'Ultraviolette Trackday | Supercars Trackday | DRE Thailand | Indian National Motorcycle Racing Championship | MadRabbit Racing Trackday | Apex Racing Trackday | RACR Trackday | BRIC 2025 | MSBK 2025 | Honda Thailand Talent Cup';

// Puzzle entrance directions — different values from Gallery
const mobilePuzzleDirections = [
  { x: '160px',  y: '-130px', rotate: '22deg'  },
  { x: '-100px', y: '-180px', rotate: '-18deg' },
  { x: '130px',  y: '-160px', rotate: '14deg'  },
  { x: '-170px', y: '90px',   rotate: '-22deg' },
  { x: '160px',  y: '140px',  rotate: '17deg'  },
  { x: '-140px', y: '160px',  rotate: '-12deg' },
  { x: '170px',  y: '-90px',  rotate: '19deg'  },
  { x: '-120px', y: '180px',  rotate: '21deg'  },
  { x: '110px',  y: '170px',  rotate: '-16deg' },
  { x: '-160px', y: '-120px', rotate: '13deg'  },
];

const desktopPuzzleDirections = [
  { x: '170px',  y: '-160px', rotate: '22deg'  },
  { x: '-130px', y: '-170px', rotate: '-17deg' },
  { x: '0',      y: '-220px', rotate: '11deg'  },
  { x: '160px',  y: '-140px', rotate: '-23deg' },
  { x: '-180px', y: '-110px', rotate: '18deg'  },
  { x: '200px',  y: '90px',   rotate: '-19deg' },
  { x: '-170px', y: '130px',  rotate: '23deg'  },
  { x: '140px',  y: '170px',  rotate: '-14deg' },
  { x: '-200px', y: '180px',  rotate: '16deg'  },
  { x: '0',      y: '210px',  rotate: '-21deg' },
  { x: '190px',  y: '-170px', rotate: '15deg'  },
  { x: '-150px', y: '190px',  rotate: '-20deg' },
];

const Motorsports = () => {
  const [activeImage, setActiveImage] = useState(null);
  const { content } = usePageContent();

  const [titleRef, titleInView] = useInView({ threshold: 0.5 });
  const [mobileGridRef, mobileGridInView] = useInView({ threshold: 0.2 });
  const [desktopGridRef, desktopGridInView] = useInView({ threshold: 0.2 });

  const rawUrls = Array.isArray(motorsportsData?.motorsports) ? motorsportsData.motorsports : [];
  const desktopUrls = rawUrls.slice(0, 12);
  const mobileUrls = rawUrls.slice(0, 10);

  const getImg = (urls, index) => urls[index] || null;

  const handleImageClick = (index) => {
    setActiveImage(activeImage === index ? null : index);
  };

  const makeMobileCell = (idx, gridRow, gridCol, roundedClass, baseRadius, extraImgClass) => {
    const url = getImg(mobileUrls, idx);
    const dir = mobilePuzzleDirections[idx] || { x: '0', y: '0', rotate: '0deg' };
    const isActive = activeImage === idx;
    return (
      <div
        key={idx}
        style={{
          gridRow,
          gridColumn: gridCol,
          '--slide-x': dir.x,
          '--slide-y': dir.y,
          '--rotate': dir.rotate,
          animationDelay: `${idx * 100}ms`,
        }}
        className={`relative cursor-pointer overflow-visible ${roundedClass} puzzle-piece ${mobileGridInView ? 'animate-in' : ''}`}
        onClick={() => handleImageClick(idx)}
      >
        {url ? (
          <img
            src={url}
            alt={`Motorsports ${idx + 1}`}
            loading="lazy"
            decoding="async"
            width="600"
            height="800"
            className={`w-full h-full object-cover ${roundedClass} transition-all duration-500 ease-in-out ${extraImgClass || ''} ${
              isActive ? 'scale-125 z-50' : 'z-0'
            }`}
            style={{
              boxShadow: isActive ? '0 35px 80px 10px rgba(0,0,0,0.9)' : '0 0 0 rgba(0,0,0,0)',
              borderRadius: isActive ? '16px' : baseRadius,
              position: 'relative',
            }}
          />
        ) : (
          <div className={`w-full h-full bg-gray-200 ${roundedClass}`} style={{ borderRadius: baseRadius }} />
        )}
      </div>
    );
  };

  const makeDesktopCell = (idx, gridRow, gridCol, roundedClass, baseRadius) => {
    const url = getImg(desktopUrls, idx);
    const dir = desktopPuzzleDirections[idx] || { x: '0', y: '0', rotate: '0deg' };
    const isActive = activeImage === idx;
    return (
      <div
        key={idx}
        style={{
          gridRow,
          gridColumn: gridCol,
          '--slide-x': dir.x,
          '--slide-y': dir.y,
          '--rotate': dir.rotate,
          animationDelay: `${idx * 100}ms`,
        }}
        className={`relative group cursor-pointer overflow-visible ${roundedClass} puzzle-piece ${desktopGridInView ? 'animate-in' : ''} ${isActive ? 'z-50' : 'z-0 hover:z-50'}`}
      >
        {url ? (
          <img
            src={url}
            alt={`Motorsports ${idx + 1}`}
            loading="lazy"
            decoding="async"
            width="800"
            height="600"
            onClick={() => handleImageClick(idx)}
            className={`w-full h-full object-cover ${roundedClass} transition-all duration-500 ease-in-out ${
              isActive
                ? 'scale-125'
                : 'group-hover:scale-125'
            }`}
            style={{
              boxShadow: isActive ? '0 35px 80px 10px rgba(0,0,0,0.9)' : '0 0 0 rgba(0,0,0,0)',
              borderRadius: isActive ? '16px' : baseRadius,
              position: 'relative',
            }}
            onMouseEnter={(e) => {
              if (activeImage !== null && activeImage !== idx) setActiveImage(null);
              if (activeImage !== idx) {
                e.currentTarget.style.boxShadow = '0 35px 80px 10px rgba(0,0,0,0.9)';
                e.currentTarget.style.borderRadius = '16px';
              }
            }}
            onMouseLeave={(e) => {
              if (activeImage !== idx) {
                e.currentTarget.style.boxShadow = '0 0 0 rgba(0,0,0,0)';
                e.currentTarget.style.borderRadius = baseRadius;
              }
            }}
          />
        ) : (
          <div className={`w-full h-full bg-gray-200 ${roundedClass}`} style={{ borderRadius: baseRadius }} />
        )}
      </div>
    );
  };

  return (
    <section id="motorsports" className="bg-[#ECEDF0] py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2
          ref={titleRef}
          className={`text-5xl md:text-6xl font-bold text-left mb-12 will-animate ${titleInView ? 'animate-fade-up animation-complete' : ''}`}
        >
          {stripHtmlTags(content?.motorsports_title) || 'MOTORSPORTS'}
        </h2>

        {/* Mobile grid: 3 columns x 8 rows, 10 images — tiles cleanly */}
        <div
          ref={mobileGridRef}
          className="md:hidden relative overflow-visible mx-auto"
          style={{ maxWidth: '360px' }}
        >
          <div
            className="grid gap-1.5 overflow-visible rounded-3xl"
            style={{
              gridTemplateColumns: '1fr 1.1fr 1fr',
              gridTemplateRows: 'repeat(8, 1fr)',
              height: '580px',
            }}
          >
            {makeMobileCell(0, '1 / 3', '1',     'rounded-tl-3xl', '24px 0 0 0')}
            {makeMobileCell(1, '1 / 4', '2',     '',               '0')}
            {makeMobileCell(2, '1 / 3', '3',     'rounded-tr-3xl', '0 24px 0 0')}
            {makeMobileCell(3, '3 / 5', '1',     '',               '0')}
            {makeMobileCell(4, '3 / 7', '3',     '',               '0')}
            {makeMobileCell(5, '4 / 6', '2',     '',               '0')}
            {makeMobileCell(6, '5 / 7', '1',     '',               '0')}
            {makeMobileCell(7, '6 / 9', '2',     '',               '0')}
            {makeMobileCell(8, '7 / 9', '1',     'rounded-bl-3xl', '0 0 0 24px')}
            {makeMobileCell(9, '7 / 9', '3',     'rounded-br-3xl', '0 0 24px 0')}
          </div>
        </div>

        {/* Desktop grid: 5 columns x 8 rows, 12 images — tiles cleanly */}
        <div
          ref={desktopGridRef}
          className="hidden md:grid gap-1.5 overflow-visible mx-auto w-full max-w-5xl"
          style={{
            gridTemplateColumns: '1.2fr 1fr 1.1fr 1fr 1.2fr',
            gridTemplateRows: 'repeat(8, 1fr)',
            height: '480px',
          }}
        >
          {makeDesktopCell(0,  '1 / 3', '1',     'rounded-tl-3xl', '24px 0 0 0')}
          {makeDesktopCell(1,  '1 / 4', '2',     '',               '0')}
          {makeDesktopCell(2,  '1 / 4', '3',     '',               '0')}
          {makeDesktopCell(3,  '1 / 4', '4',     '',               '0')}
          {makeDesktopCell(4,  '1 / 5', '5',     'rounded-tr-3xl', '0 24px 0 0')}
          {makeDesktopCell(5,  '3 / 6', '1',     '',               '0')}
          {makeDesktopCell(6,  '4 / 7', '2',     '',               '0')}
          {makeDesktopCell(7,  '4 / 7', '3',     '',               '0')}
          {makeDesktopCell(8,  '4 / 7', '4',     '',               '0')}
          {makeDesktopCell(9,  '5 / 9', '5',     'rounded-br-3xl', '0 0 24px 0')}
          {makeDesktopCell(10, '6 / 9', '1',     'rounded-bl-3xl', '0 0 0 24px')}
          {makeDesktopCell(11, '7 / 9', '2 / 5', '',               '0')}
        </div>

        {/* Footer text */}
        <div
          className="text-base md:text-lg text-black font-medium leading-relaxed max-w-4xl mx-auto text-center mt-8"
          style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}
          dangerouslySetInnerHTML={prepareHtml(content?.motorsports_footer_text, FOOTER_FALLBACK)}
        />
      </div>
    </section>
  );
};

export default Motorsports;
