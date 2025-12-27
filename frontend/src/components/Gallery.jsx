import { useState, useEffect } from 'react';
import { useInView } from '../hooks/useInView';
import api from '../services/api';

const Gallery = () => {
  const [activeImage, setActiveImage] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Animation refs
  const [titleRef, titleInView] = useInView({ threshold: 0.5 });
  const [mobileGalleryRef, mobileGalleryInView] = useInView({ threshold: 0.3 });
  const [desktopGalleryRef, desktopGalleryInView] = useInView({ threshold: 0.3 });

  // Fallback images
  const fallbackImages = [
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=600',
    'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=600',
    'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?q=80&w=600',
    'https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=600',
    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=600',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=600',
    'https://images.unsplash.com/photo-1580273916550-e323be2ae537?q=80&w=600',
    'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=600',
    'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=600',
    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=600',
    'https://images.unsplash.com/photo-1563720360172-67b8f3dce741?q=80&w=600',
    'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=600',
  ];

  // Fetch gallery images from API (with time-based caching to prevent reloads)
  useEffect(() => {
    const cacheKey = `gallery_${isMobile ? 'mobile' : 'desktop'}`;
    const cacheTimeKey = `${cacheKey}_time`;
    const cached = sessionStorage.getItem(cacheKey);
    const cacheTime = sessionStorage.getItem(cacheTimeKey);

    // Cache expires after 30 seconds
    const CACHE_DURATION = 30 * 1000; // 30 seconds
    const now = Date.now();

    if (cached && cacheTime && (now - parseInt(cacheTime)) < CACHE_DURATION) {
      try {
        const cachedImages = JSON.parse(cached);
        setGalleryImages(cachedImages);
        return;
      } catch (e) {
        // Invalid cache, continue to fetch
      }
    }

    async function fetchImages() {
      try {
        const endpoint = isMobile ? 'mobile' : '';
        const data = await api.getGalleryImages(endpoint);
        const imageUrls = data.map(img => img.cdn_url).filter(url => url); // Filter out null/undefined
        const images = imageUrls.length > 0 ? imageUrls : fallbackImages;
        setGalleryImages(images);

        // Cache in sessionStorage with timestamp
        sessionStorage.setItem(cacheKey, JSON.stringify(images));
        sessionStorage.setItem(cacheTimeKey, now.toString());
      } catch (error) {
        console.error('Failed to load gallery images:', error);
        setGalleryImages(fallbackImages);
      }
    }
    fetchImages();
  }, [isMobile]);

  // Puzzle piece slide directions for mobile (10 images)
  const mobilePuzzleDirections = [
    { x: '-150px', y: '-150px', rotate: '-20deg' },  // Image 1: top-left
    { x: '0', y: '-200px', rotate: '15deg' },        // Image 2: top-center
    { x: '150px', y: '-150px', rotate: '-12deg' },   // Image 3: top-right
    { x: '-180px', y: '0', rotate: '18deg' },        // Image 4: middle-left
    { x: '200px', y: '120px', rotate: '-10deg' },    // Image 5: center (mustang)
    { x: '-200px', y: '100px', rotate: '20deg' },    // Image 6: lower-left
    { x: '180px', y: '120px', rotate: '-15deg' },    // Image 7: lower-right
    { x: '-150px', y: '200px', rotate: '12deg' },    // Image 8: bottom-left
    { x: '0', y: '200px', rotate: '-18deg' },        // Image 9: bottom-center
    { x: '150px', y: '200px', rotate: '15deg' }      // Image 10: bottom-right
  ];

  // Puzzle piece slide directions for desktop (12 images)
  const desktopPuzzleDirections = [
    { x: '-180px', y: '-180px', rotate: '-20deg' },  // Image 1: R1C1
    { x: '-120px', y: '-150px', rotate: '15deg' },   // Image 2: R1C2
    { x: '0', y: '-200px', rotate: '-12deg' },       // Image 3: R1C3 (tall)
    { x: '120px', y: '-180px', rotate: '18deg' },    // Image 4: R1C4
    { x: '200px', y: '-150px', rotate: '-15deg' },   // Image 5: R1C5
    { x: '-200px', y: '80px', rotate: '20deg' },     // Image 6: R2C1+C2 (wide)
    { x: '150px', y: '100px', rotate: '-18deg' },    // Image 7: R2C4
    { x: '200px', y: '80px', rotate: '15deg' },      // Image 8: R2C5
    { x: '-180px', y: '200px', rotate: '18deg' },    // Image 9: R3C1+C2
    { x: '-120px', y: '180px', rotate: '-20deg' },   // Image 10: R3C2
    { x: '0', y: '200px', rotate: '15deg' },         // Image 11: R3C3
    { x: '200px', y: '200px', rotate: '-18deg' }     // Image 12: R3C5
  ];

  const handleImageClick = (index) => {
    setActiveImage(activeImage === index ? null : index);
  };

  return (
    <section id="gallery" className="pt-12 pb-0 md:pt-16 md:pb-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2
          ref={titleRef}
          className={`text-5xl md:text-6xl font-bold text-center mb-12 will-animate ${titleInView ? 'animate-fade-up animation-complete' : ''}`}
        >
          GALLERY
        </h2>

        {/* Mobile: Custom Collage Grid */}
        <div
          ref={mobileGalleryRef}
          className="md:hidden relative overflow-visible mx-auto"
          style={{
            maxWidth: '400px'
          }}
        >
          <div
            className="grid gap-1.5 overflow-visible rounded-3xl"
            style={{
              gridTemplateColumns: '1fr 1.3fr 1.1fr',
              gridTemplateRows: 'repeat(20, 1fr)',
              height: '750px'
            }}
          >
            {/* Image 1: Top-left corner - small */}
            <div
              style={{
                gridRow: '1 / 4',
                gridColumn: '1',
                '--slide-x': mobilePuzzleDirections[0].x,
                '--slide-y': mobilePuzzleDirections[0].y,
                '--rotate': mobilePuzzleDirections[0].rotate,
                animationDelay: '0ms'
              }}
              className={`relative cursor-pointer overflow-visible rounded-tl-3xl puzzle-piece ${mobileGalleryInView ? 'animate-in' : ''}`}
            >
              <img
                src={galleryImages[0]}
                alt="Gallery 1"
                loading="lazy"
                decoding="async"
                width="600"
                height="800"
                onClick={() => handleImageClick(0)}
                className={`w-full h-full object-cover rounded-tl-3xl transition-all duration-500 ease-in-out ${
                  activeImage === 0 ? 'scale-125 z-50' : 'grayscale brightness-75 z-0'
                }`}
                style={{
                  boxShadow: activeImage === 0 ? '0 35px 80px 10px rgba(0, 0, 0, 0.9)' : '0 0 0 rgba(0,0,0,0)',
                  borderRadius: activeImage === 0 ? '16px' : '24px 0 0 0',
                  position: 'relative'
                }}
              />
            </div>

            {/* Image 2: Top-center - tall */}
            <div
              style={{
                gridRow: '1 / 6',
                gridColumn: '2',
                '--slide-x': mobilePuzzleDirections[1].x,
                '--slide-y': mobilePuzzleDirections[1].y,
                '--rotate': mobilePuzzleDirections[1].rotate,
                animationDelay: '100ms'
              }}
              className={`relative cursor-pointer overflow-visible puzzle-piece ${mobileGalleryInView ? 'animate-in' : ''}`}
            >
              <img
                src={galleryImages[1]}
                alt="Gallery 2"
                loading="lazy"
                decoding="async"
                width="600"
                height="800"
                onClick={() => handleImageClick(1)}
                className={`w-full h-full object-cover transition-all duration-500 ease-in-out ${
                  activeImage === 1 ? 'scale-125 z-50' : 'grayscale brightness-75 z-0'
                }`}
                style={{
                  boxShadow: activeImage === 1 ? '0 35px 80px 10px rgba(0, 0, 0, 0.9)' : '0 0 0 rgba(0,0,0,0)',
                  borderRadius: activeImage === 1 ? '16px' : '0',
                  position: 'relative'
                }}
              />
            </div>

            {/* Image 3: Top-right corner - medium */}
            <div
              style={{
                gridRow: '1 / 6',
                gridColumn: '3',
                '--slide-x': mobilePuzzleDirections[2].x,
                '--slide-y': mobilePuzzleDirections[2].y,
                '--rotate': mobilePuzzleDirections[2].rotate,
                animationDelay: '200ms'
              }}
              className={`relative cursor-pointer overflow-visible rounded-tr-3xl puzzle-piece ${mobileGalleryInView ? 'animate-in' : ''}`}
            >
              <img
                src={galleryImages[2]}
                alt="Gallery 3"
                loading="lazy"
                decoding="async"
                width="600"
                height="800"
                onClick={() => handleImageClick(2)}
                className={`w-full h-full object-cover rounded-tr-3xl transition-all duration-500 ease-in-out ${
                  activeImage === 2 ? 'scale-125 z-50' : 'grayscale brightness-75 z-0'
                }`}
                style={{
                  boxShadow: activeImage === 2 ? '0 35px 80px 10px rgba(0, 0, 0, 0.9)' : '0 0 0 rgba(0,0,0,0)',
                  borderRadius: activeImage === 2 ? '16px' : '0 24px 0 0',
                  position: 'relative'
                }}
              />
            </div>

            {/* Image 4: Middle-left - small */}
            <div
              style={{
                gridRow: '4 / 7',
                gridColumn: '1',
                '--slide-x': mobilePuzzleDirections[3].x,
                '--slide-y': mobilePuzzleDirections[3].y,
                '--rotate': mobilePuzzleDirections[3].rotate,
                animationDelay: '300ms'
              }}
              className={`relative cursor-pointer overflow-visible puzzle-piece ${mobileGalleryInView ? 'animate-in' : ''}`}
            >
              <img
                src={galleryImages[3]}
                alt="Gallery 4"
                loading="lazy"
                decoding="async"
                width="600"
                height="800"
                onClick={() => handleImageClick(3)}
                className={`w-full h-full object-cover transition-all duration-500 ease-in-out ${
                  activeImage === 3 ? 'scale-125 z-50' : 'grayscale brightness-75 z-0'
                }`}
                style={{
                  boxShadow: activeImage === 3 ? '0 35px 80px 10px rgba(0, 0, 0, 0.9)' : '0 0 0 rgba(0,0,0,0)',
                  borderRadius: activeImage === 3 ? '16px' : '0',
                  position: 'relative'
                }}
              />
            </div>

            {/* Image 5: Center - large Mustang spanning 2 columns */}
            <div
              style={{
                gridRow: '6 / 11',
                gridColumn: '2 / 4',
                '--slide-x': mobilePuzzleDirections[4].x,
                '--slide-y': mobilePuzzleDirections[4].y,
                '--rotate': mobilePuzzleDirections[4].rotate,
                animationDelay: '400ms'
              }}
              className={`relative cursor-pointer overflow-visible puzzle-piece ${mobileGalleryInView ? 'animate-in' : ''}`}
            >
              <img
                src={galleryImages[4]}
                alt="Gallery 5"
                loading="lazy"
                decoding="async"
                width="600"
                height="800"
                onClick={() => handleImageClick(4)}
                className={`w-full h-full object-cover transition-all duration-500 ease-in-out ${
                  activeImage === 4 ? 'scale-125 z-50' : 'grayscale brightness-75 z-0'
                }`}
                style={{
                  boxShadow: activeImage === 4 ? '0 35px 80px 10px rgba(0, 0, 0, 0.9)' : '0 0 0 rgba(0,0,0,0)',
                  borderRadius: activeImage === 4 ? '16px' : '0',
                  position: 'relative'
                }}
              />
            </div>

            {/* Image 6: Lower-left - Camaro */}
            <div
              style={{
                gridRow: '7 / 12',
                gridColumn: '1',
                '--slide-x': mobilePuzzleDirections[5].x,
                '--slide-y': mobilePuzzleDirections[5].y,
                '--rotate': mobilePuzzleDirections[5].rotate,
                animationDelay: '500ms'
              }}
              className={`relative cursor-pointer overflow-visible puzzle-piece ${mobileGalleryInView ? 'animate-in' : ''}`}
            >
              <img
                src={galleryImages[5]}
                alt="Gallery 6"
                loading="lazy"
                decoding="async"
                width="600"
                height="800"
                onClick={() => handleImageClick(5)}
                className={`w-full h-full object-cover transition-all duration-500 ease-in-out ${
                  activeImage === 5 ? 'scale-125 z-50' : 'grayscale brightness-75 z-0'
                }`}
                style={{
                  boxShadow: activeImage === 5 ? '0 35px 80px 10px rgba(0, 0, 0, 0.9)' : '0 0 0 rgba(0,0,0,0)',
                  borderRadius: activeImage === 5 ? '16px' : '0',
                  position: 'relative'
                }}
              />
            </div>

            {/* Image 7: Lower-right - car */}
            <div
              style={{
                gridRow: '11 / 15',
                gridColumn: '3',
                '--slide-x': mobilePuzzleDirections[6].x,
                '--slide-y': mobilePuzzleDirections[6].y,
                '--rotate': mobilePuzzleDirections[6].rotate,
                animationDelay: '600ms'
              }}
              className={`relative cursor-pointer overflow-visible puzzle-piece ${mobileGalleryInView ? 'animate-in' : ''}`}
            >
              <img
                src={galleryImages[6]}
                alt="Gallery 7"
                loading="lazy"
                decoding="async"
                width="600"
                height="800"
                onClick={() => handleImageClick(6)}
                className={`w-full h-full object-cover transition-all duration-500 ease-in-out ${
                  activeImage === 6 ? 'scale-125 z-50' : 'grayscale brightness-75 z-0'
                }`}
                style={{
                  boxShadow: activeImage === 6 ? '0 35px 80px 10px rgba(0, 0, 0, 0.9)' : '0 0 0 rgba(0,0,0,0)',
                  borderRadius: activeImage === 6 ? '16px' : '0',
                  position: 'relative'
                }}
              />
            </div>

            {/* Image 8: Bottom-left corner - palm trees */}
            <div
              style={{
                gridRow: '12 / 16',
                gridColumn: '1',
                '--slide-x': mobilePuzzleDirections[7].x,
                '--slide-y': mobilePuzzleDirections[7].y,
                '--rotate': mobilePuzzleDirections[7].rotate,
                animationDelay: '700ms'
              }}
              className={`relative cursor-pointer overflow-visible rounded-bl-3xl puzzle-piece ${mobileGalleryInView ? 'animate-in' : ''}`}
            >
              <img
                src={galleryImages[7]}
                alt="Gallery 8"
                loading="lazy"
                decoding="async"
                width="600"
                height="800"
                onClick={() => handleImageClick(7)}
                className={`w-full h-full object-cover rounded-bl-3xl transition-all duration-500 ease-in-out ${
                  activeImage === 7 ? 'scale-125 z-50' : 'grayscale brightness-75 z-0'
                }`}
                style={{
                  boxShadow: activeImage === 7 ? '0 35px 80px 10px rgba(0, 0, 0, 0.9)' : '0 0 0 rgba(0,0,0,0)',
                  borderRadius: activeImage === 7 ? '16px' : '0 0 0 24px',
                  position: 'relative'
                }}
              />
            </div>

            {/* Image 9: Bottom-center - golfer */}
            <div
              style={{
                gridRow: '11 / 16',
                gridColumn: '2',
                '--slide-x': mobilePuzzleDirections[8].x,
                '--slide-y': mobilePuzzleDirections[8].y,
                '--rotate': mobilePuzzleDirections[8].rotate,
                animationDelay: '800ms'
              }}
              className={`relative cursor-pointer overflow-visible puzzle-piece ${mobileGalleryInView ? 'animate-in' : ''}`}
            >
              <img
                src={galleryImages[8]}
                alt="Gallery 9"
                loading="lazy"
                decoding="async"
                width="600"
                height="800"
                onClick={() => handleImageClick(8)}
                className={`w-full h-full object-cover transition-all duration-500 ease-in-out ${
                  activeImage === 8 ? 'scale-125 z-50' : 'grayscale brightness-75 z-0'
                }`}
                style={{
                  boxShadow: activeImage === 8 ? '0 35px 80px 10px rgba(0, 0, 0, 0.9)' : '0 0 0 rgba(0,0,0,0)',
                  borderRadius: activeImage === 8 ? '16px' : '0',
                  position: 'relative'
                }}
              />
            </div>

            {/* Image 10: Bottom-right corner - car */}
            <div
              style={{
                gridRow: '15 / 16',
                gridColumn: '3',
                '--slide-x': mobilePuzzleDirections[9].x,
                '--slide-y': mobilePuzzleDirections[9].y,
                '--rotate': mobilePuzzleDirections[9].rotate,
                animationDelay: '900ms'
              }}
              className={`relative cursor-pointer overflow-visible rounded-br-3xl puzzle-piece ${mobileGalleryInView ? 'animate-in' : ''}`}
            >
              <img
                src={galleryImages[9]}
                alt="Gallery 10"
                loading="lazy"
                decoding="async"
                width="600"
                height="800"
                onClick={() => handleImageClick(9)}
                className={`w-full h-full object-cover rounded-br-3xl transition-all duration-500 ease-in-out ${
                  activeImage === 9 ? 'scale-125 z-50' : 'grayscale brightness-75 z-0'
                }`}
                style={{
                  boxShadow: activeImage === 9 ? '0 35px 80px 10px rgba(0, 0, 0, 0.9)' : '0 0 0 rgba(0,0,0,0)',
                  borderRadius: activeImage === 9 ? '16px' : '0 0 24px 0',
                  position: 'relative'
                }}
              />
            </div>
          </div>
        </div>

        {/* Desktop: Custom Complex Grid */}
        <div
          ref={desktopGalleryRef}
          className="hidden md:grid gap-1.5 overflow-visible"
          style={{
            gridTemplateColumns: '1fr 1.3fr 1.5fr 1.5fr 1.6fr',
            gridTemplateRows: 'repeat(12, 1fr)',
            height: '550px'
          }}
        >
          {/* Image 1: R1C1 - Top Left Corner */}
          <div
            style={{
              gridRow: '1 / 5',
              gridColumn: '1',
              '--slide-x': desktopPuzzleDirections[0].x,
              '--slide-y': desktopPuzzleDirections[0].y,
              '--rotate': desktopPuzzleDirections[0].rotate,
              animationDelay: '0ms'
            }}
            className={`relative group cursor-pointer overflow-visible rounded-tl-3xl puzzle-piece ${desktopGalleryInView ? 'animate-in' : ''} ${activeImage === 0 ? 'z-50' : 'z-0 hover:z-50'}`}
          >
            <img
              src={galleryImages[0]}
              alt="Gallery 1"
              loading="lazy"
              width="800"
              height="600"
              onClick={() => handleImageClick(0)}
              className={`w-full h-full object-cover rounded-tl-3xl transition-all duration-500 ease-in-out ${
                activeImage === 0
                  ? 'grayscale-0 brightness-100 scale-125'
                  : 'grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 group-hover:scale-125'
              }`}
              style={{
                boxShadow: activeImage === 0 ? '0 35px 80px 10px rgba(0, 0, 0, 0.9)' : '0 0 0 rgba(0,0,0,0)',
                borderRadius: activeImage === 0 ? '16px' : '24px 0 0 0',
                position: 'relative'
              }}
              onMouseEnter={(e) => { if (activeImage !== null && activeImage !== 0) setActiveImage(null); if (activeImage !== 0) { e.currentTarget.style.boxShadow = '0 35px 80px 10px rgba(0, 0, 0, 0.9)'; e.currentTarget.style.borderRadius = '16px'; } }}
              onMouseLeave={(e) => { if (activeImage !== 0) { e.currentTarget.style.boxShadow = '0 0 0 rgba(0,0,0,0)'; e.currentTarget.style.borderRadius = '24px 0 0 0'; } }}
            />
          </div>

          {/* Image 2: R1C2 */}
          <div
            style={{
              gridRow: '1 / 5',
              gridColumn: '2',
              '--slide-x': desktopPuzzleDirections[1].x,
              '--slide-y': desktopPuzzleDirections[1].y,
              '--rotate': desktopPuzzleDirections[1].rotate,
              animationDelay: '100ms'
            }}
            className={`relative group cursor-pointer overflow-visible puzzle-piece ${desktopGalleryInView ? 'animate-in' : ''} ${activeImage === 1 ? 'z-50' : 'z-0 hover:z-50'}`}
          >
            <img
              src={galleryImages[1]}
              alt="Gallery 2"
              loading="lazy"
              width="800"
              height="600"
              onClick={() => handleImageClick(1)}
              className={`w-full h-full object-cover transition-all duration-500 ease-in-out ${
                activeImage === 1
                  ? 'grayscale-0 brightness-100 scale-125'
                  : 'grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 group-hover:scale-125'
              }`}
              style={{
                boxShadow: activeImage === 1 ? '0 35px 80px 10px rgba(0, 0, 0, 0.9)' : '0 0 0 rgba(0,0,0,0)',
                borderRadius: activeImage === 1 ? '16px' : '0',
                position: 'relative'
              }}
              onMouseEnter={(e) => { if (activeImage !== null && activeImage !== 1) setActiveImage(null); if (activeImage !== 1) { e.currentTarget.style.boxShadow = '0 35px 80px 10px rgba(0, 0, 0, 0.9)'; e.currentTarget.style.borderRadius = '16px'; } }}
              onMouseLeave={(e) => { if (activeImage !== 1) { e.currentTarget.style.boxShadow = '0 0 0 rgba(0,0,0,0)'; e.currentTarget.style.borderRadius = '0'; } }}
            />
          </div>

          {/* Image 3: R1C3 + R2C3 (spans 2 rows) */}
          <div
            style={{
              gridRow: '1 / 9',
              gridColumn: '3',
              '--slide-x': desktopPuzzleDirections[2].x,
              '--slide-y': desktopPuzzleDirections[2].y,
              '--rotate': desktopPuzzleDirections[2].rotate,
              animationDelay: '200ms'
            }}
            className={`relative group cursor-pointer overflow-visible puzzle-piece ${desktopGalleryInView ? 'animate-in' : ''} ${activeImage === 2 ? 'z-50' : 'z-0 hover:z-50'}`}
          >
            <img
              src={galleryImages[2]}
              alt="Gallery 3"
              loading="lazy"
              width="800"
              height="600"
              onClick={() => handleImageClick(2)}
              className={`w-full h-full object-cover transition-all duration-500 ease-in-out ${
                activeImage === 2
                  ? 'grayscale-0 brightness-100 scale-125'
                  : 'grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 group-hover:scale-125'
              }`}
              style={{
                boxShadow: activeImage === 2 ? '0 35px 80px 10px rgba(0, 0, 0, 0.9)' : '0 0 0 rgba(0,0,0,0)',
                borderRadius: activeImage === 2 ? '16px' : '0',
                position: 'relative'
              }}
              onMouseEnter={(e) => { if (activeImage !== null && activeImage !== 2) setActiveImage(null); if (activeImage !== 2) { e.currentTarget.style.boxShadow = '0 35px 80px 10px rgba(0, 0, 0, 0.9)'; e.currentTarget.style.borderRadius = '16px'; } }}
              onMouseLeave={(e) => { if (activeImage !== 2) { e.currentTarget.style.boxShadow = '0 0 0 rgba(0,0,0,0)'; e.currentTarget.style.borderRadius = '0'; } }}
            />
          </div>

          {/* Image 4: R1C4 + part of R2C4 */}
          <div
            style={{
              gridRow: '1 / 6',
              gridColumn: '4',
              '--slide-x': desktopPuzzleDirections[3].x,
              '--slide-y': desktopPuzzleDirections[3].y,
              '--rotate': desktopPuzzleDirections[3].rotate,
              animationDelay: '300ms'
            }}
            className={`relative group cursor-pointer overflow-visible puzzle-piece ${desktopGalleryInView ? 'animate-in' : ''} ${activeImage === 3 ? 'z-50' : 'z-0 hover:z-50'}`}
          >
            <img
              src={galleryImages[3]}
              alt="Gallery 4"
              loading="lazy"
              width="800"
              height="600"
              onClick={() => handleImageClick(3)}
              className={`w-full h-full object-cover transition-all duration-500 ease-in-out ${
                activeImage === 3
                  ? 'grayscale-0 brightness-100 scale-125'
                  : 'grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 group-hover:scale-125'
              }`}
              style={{
                boxShadow: activeImage === 3 ? '0 35px 80px 10px rgba(0, 0, 0, 0.9)' : '0 0 0 rgba(0,0,0,0)',
                borderRadius: activeImage === 3 ? '16px' : '0',
                position: 'relative'
              }}
              onMouseEnter={(e) => { if (activeImage !== null && activeImage !== 3) setActiveImage(null); if (activeImage !== 3) { e.currentTarget.style.boxShadow = '0 35px 80px 10px rgba(0, 0, 0, 0.9)'; e.currentTarget.style.borderRadius = '16px'; } }}
              onMouseLeave={(e) => { if (activeImage !== 3) { e.currentTarget.style.boxShadow = '0 0 0 rgba(0,0,0,0)'; e.currentTarget.style.borderRadius = '0'; } }}
            />
          </div>

          {/* Image 5: More than half of R1C5 (increased height) - Top Right Corner */}
          <div
            style={{
              gridRow: '1 / 4',
              gridColumn: '5',
              '--slide-x': desktopPuzzleDirections[4].x,
              '--slide-y': desktopPuzzleDirections[4].y,
              '--rotate': desktopPuzzleDirections[4].rotate,
              animationDelay: '400ms'
            }}
            className={`relative group cursor-pointer overflow-visible rounded-tr-3xl puzzle-piece ${desktopGalleryInView ? 'animate-in' : ''} ${activeImage === 4 ? 'z-50' : 'z-0 hover:z-50'}`}
          >
            <img
              src={galleryImages[4]}
              alt="Gallery 5"
              loading="lazy"
              width="800"
              height="600"
              onClick={() => handleImageClick(4)}
              className={`w-full h-full object-cover rounded-tr-3xl transition-all duration-500 ease-in-out ${
                activeImage === 4
                  ? 'grayscale-0 brightness-100 scale-125'
                  : 'grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 group-hover:scale-125'
              }`}
              style={{
                boxShadow: activeImage === 4 ? '0 35px 80px 10px rgba(0, 0, 0, 0.9)' : '0 0 0 rgba(0,0,0,0)',
                borderRadius: activeImage === 4 ? '16px' : '0 24px 0 0',
                position: 'relative'
              }}
              onMouseEnter={(e) => { if (activeImage !== null && activeImage !== 4) setActiveImage(null); if (activeImage !== 4) { e.currentTarget.style.boxShadow = '0 35px 80px 10px rgba(0, 0, 0, 0.9)'; e.currentTarget.style.borderRadius = '16px'; } }}
              onMouseLeave={(e) => { if (activeImage !== 4) { e.currentTarget.style.boxShadow = '0 0 0 rgba(0,0,0,0)'; e.currentTarget.style.borderRadius = '0 24px 0 0'; } }}
            />
          </div>

          {/* Image 6: R2C1 + R2C2 (spans 2 columns) */}
          <div
            style={{
              gridRow: '5 / 9',
              gridColumn: '1 / 3',
              '--slide-x': desktopPuzzleDirections[5].x,
              '--slide-y': desktopPuzzleDirections[5].y,
              '--rotate': desktopPuzzleDirections[5].rotate,
              animationDelay: '500ms'
            }}
            className={`relative group cursor-pointer overflow-visible puzzle-piece ${desktopGalleryInView ? 'animate-in' : ''} ${activeImage === 5 ? 'z-50' : 'z-0 hover:z-50'}`}
          >
            <img
              src={galleryImages[5]}
              alt="Gallery 6"
              loading="lazy"
              width="800"
              height="600"
              onClick={() => handleImageClick(5)}
              className={`w-full h-full object-cover transition-all duration-500 ease-in-out ${
                activeImage === 5
                  ? 'grayscale-0 brightness-100 scale-125'
                  : 'grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 group-hover:scale-125'
              }`}
              style={{
                boxShadow: activeImage === 5 ? '0 35px 80px 10px rgba(0, 0, 0, 0.9)' : '0 0 0 rgba(0,0,0,0)',
                borderRadius: activeImage === 5 ? '16px' : '0',
                position: 'relative'
              }}
              onMouseEnter={(e) => { if (activeImage !== null && activeImage !== 5) setActiveImage(null); if (activeImage !== 5) { e.currentTarget.style.boxShadow = '0 35px 80px 10px rgba(0, 0, 0, 0.9)'; e.currentTarget.style.borderRadius = '16px'; } }}
              onMouseLeave={(e) => { if (activeImage !== 5) { e.currentTarget.style.boxShadow = '0 0 0 rgba(0,0,0,0)'; e.currentTarget.style.borderRadius = '0'; } }}
            />
          </div>

          {/* Image 7: Rest of R2C4 + R3C4 */}
          <div
            style={{
              gridRow: '6 / 13',
              gridColumn: '4',
              '--slide-x': desktopPuzzleDirections[6].x,
              '--slide-y': desktopPuzzleDirections[6].y,
              '--rotate': desktopPuzzleDirections[6].rotate,
              animationDelay: '600ms'
            }}
            className={`relative group cursor-pointer overflow-visible puzzle-piece ${desktopGalleryInView ? 'animate-in' : ''} ${activeImage === 6 ? 'z-50' : 'z-0 hover:z-50'}`}
          >
            <img
              src={galleryImages[6]}
              alt="Gallery 7"
              loading="lazy"
              width="800"
              height="600"
              onClick={() => handleImageClick(6)}
              className={`w-full h-full object-cover transition-all duration-500 ease-in-out ${
                activeImage === 6
                  ? 'grayscale-0 brightness-100 scale-125'
                  : 'grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 group-hover:scale-125'
              }`}
              style={{
                boxShadow: activeImage === 6 ? '0 35px 80px 10px rgba(0, 0, 0, 0.9)' : '0 0 0 rgba(0,0,0,0)',
                borderRadius: activeImage === 6 ? '16px' : '0',
                position: 'relative'
              }}
              onMouseEnter={(e) => { if (activeImage !== null && activeImage !== 6) setActiveImage(null); if (activeImage !== 6) { e.currentTarget.style.boxShadow = '0 35px 80px 10px rgba(0, 0, 0, 0.9)'; e.currentTarget.style.borderRadius = '16px'; } }}
              onMouseLeave={(e) => { if (activeImage !== 6) { e.currentTarget.style.boxShadow = '0 0 0 rgba(0,0,0,0)'; e.currentTarget.style.borderRadius = '0'; } }}
            />
          </div>

          {/* Image 8: Rest of R1C5 + R2C5 + part of R3C5 (reduced height) */}
          <div
            style={{
              gridRow: '4 / 10',
              gridColumn: '5',
              '--slide-x': desktopPuzzleDirections[7].x,
              '--slide-y': desktopPuzzleDirections[7].y,
              '--rotate': desktopPuzzleDirections[7].rotate,
              animationDelay: '700ms'
            }}
            className={`relative group cursor-pointer overflow-visible puzzle-piece ${desktopGalleryInView ? 'animate-in' : ''} ${activeImage === 7 ? 'z-50' : 'z-0 hover:z-50'}`}
          >
            <img
              src={galleryImages[7]}
              alt="Gallery 8"
              loading="lazy"
              width="800"
              height="600"
              onClick={() => handleImageClick(7)}
              className={`w-full h-full object-cover transition-all duration-500 ease-in-out ${
                activeImage === 7
                  ? 'grayscale-0 brightness-100 scale-125'
                  : 'grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 group-hover:scale-125'
              }`}
              style={{
                boxShadow: activeImage === 7 ? '0 35px 80px 10px rgba(0, 0, 0, 0.9)' : '0 0 0 rgba(0,0,0,0)',
                borderRadius: activeImage === 7 ? '16px' : '0',
                position: 'relative'
              }}
              onMouseEnter={(e) => { if (activeImage !== null && activeImage !== 7) setActiveImage(null); if (activeImage !== 7) { e.currentTarget.style.boxShadow = '0 35px 80px 10px rgba(0, 0, 0, 0.9)'; e.currentTarget.style.borderRadius = '16px'; } }}
              onMouseLeave={(e) => { if (activeImage !== 7) { e.currentTarget.style.boxShadow = '0 0 0 rgba(0,0,0,0)'; e.currentTarget.style.borderRadius = '0'; } }}
            />
          </div>

          {/* Image 9: R3C1 + more of R3C2 (increased width) - Bottom Left Corner */}
          <div
            style={{
              gridRow: '9 / 13',
              gridColumn: '1 / 2.6',
              '--slide-x': desktopPuzzleDirections[8].x,
              '--slide-y': desktopPuzzleDirections[8].y,
              '--rotate': desktopPuzzleDirections[8].rotate,
              animationDelay: '800ms'
            }}
            className={`relative group cursor-pointer overflow-visible rounded-bl-3xl puzzle-piece ${desktopGalleryInView ? 'animate-in' : ''} ${activeImage === 8 ? 'z-50' : 'z-0 hover:z-50'}`}
          >
            <img
              src={galleryImages[8]}
              alt="Gallery 9"
              loading="lazy"
              width="800"
              height="600"
              onClick={() => handleImageClick(8)}
              className={`w-full h-full object-cover rounded-bl-3xl transition-all duration-500 ease-in-out ${
                activeImage === 8
                  ? 'grayscale-0 brightness-100 scale-125'
                  : 'grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 group-hover:scale-125'
              }`}
              style={{
                boxShadow: activeImage === 8 ? '0 35px 80px 10px rgba(0, 0, 0, 0.9)' : '0 0 0 rgba(0,0,0,0)',
                borderRadius: activeImage === 8 ? '16px' : '0 0 0 24px',
                position: 'relative'
              }}
              onMouseEnter={(e) => { if (activeImage !== null && activeImage !== 8) setActiveImage(null); if (activeImage !== 8) { e.currentTarget.style.boxShadow = '0 35px 80px 10px rgba(0, 0, 0, 0.9)'; e.currentTarget.style.borderRadius = '16px'; } }}
              onMouseLeave={(e) => { if (activeImage !== 8) { e.currentTarget.style.boxShadow = '0 0 0 rgba(0,0,0,0)'; e.currentTarget.style.borderRadius = '0 0 0 24px'; } }}
            />
          </div>

          {/* Image 10: Rest of R3C2 (reduced width) */}
          <div
            style={{
              gridRow: '9 / 13',
              gridColumn: '2.6 / 3',
              '--slide-x': desktopPuzzleDirections[9].x,
              '--slide-y': desktopPuzzleDirections[9].y,
              '--rotate': desktopPuzzleDirections[9].rotate,
              animationDelay: '900ms'
            }}
            className={`relative group cursor-pointer overflow-visible puzzle-piece ${desktopGalleryInView ? 'animate-in' : ''} ${activeImage === 9 ? 'z-50' : 'z-0 hover:z-50'}`}
          >
            <img
              src={galleryImages[9]}
              alt="Gallery 10"
              loading="lazy"
              width="800"
              height="600"
              onClick={() => handleImageClick(9)}
              className={`w-full h-full object-cover transition-all duration-500 ease-in-out ${
                activeImage === 9
                  ? 'grayscale-0 brightness-100 scale-125'
                  : 'grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 group-hover:scale-125'
              }`}
              style={{
                boxShadow: activeImage === 9 ? '0 35px 80px 10px rgba(0, 0, 0, 0.9)' : '0 0 0 rgba(0,0,0,0)',
                borderRadius: activeImage === 9 ? '16px' : '0',
                position: 'relative'
              }}
              onMouseEnter={(e) => { if (activeImage !== null && activeImage !== 9) setActiveImage(null); if (activeImage !== 9) { e.currentTarget.style.boxShadow = '0 35px 80px 10px rgba(0, 0, 0, 0.9)'; e.currentTarget.style.borderRadius = '16px'; } }}
              onMouseLeave={(e) => { if (activeImage !== 9) { e.currentTarget.style.boxShadow = '0 0 0 rgba(0,0,0,0)'; e.currentTarget.style.borderRadius = '0'; } }}
            />
          </div>

          {/* Image 11: R3C3 */}
          <div
            style={{
              gridRow: '9 / 13',
              gridColumn: '3',
              '--slide-x': desktopPuzzleDirections[10].x,
              '--slide-y': desktopPuzzleDirections[10].y,
              '--rotate': desktopPuzzleDirections[10].rotate,
              animationDelay: '1000ms'
            }}
            className={`relative group cursor-pointer overflow-visible puzzle-piece ${desktopGalleryInView ? 'animate-in' : ''} ${activeImage === 10 ? 'z-50' : 'z-0 hover:z-50'}`}
          >
            <img
              src={galleryImages[10]}
              alt="Gallery 11"
              loading="lazy"
              width="800"
              height="600"
              onClick={() => handleImageClick(10)}
              className={`w-full h-full object-cover transition-all duration-500 ease-in-out ${
                activeImage === 10
                  ? 'grayscale-0 brightness-100 scale-125'
                  : 'grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 group-hover:scale-125'
              }`}
              style={{
                boxShadow: activeImage === 10 ? '0 35px 80px 10px rgba(0, 0, 0, 0.9)' : '0 0 0 rgba(0,0,0,0)',
                borderRadius: activeImage === 10 ? '16px' : '0',
                position: 'relative'
              }}
              onMouseEnter={(e) => { if (activeImage !== null && activeImage !== 10) setActiveImage(null); if (activeImage !== 10) { e.currentTarget.style.boxShadow = '0 35px 80px 10px rgba(0, 0, 0, 0.9)'; e.currentTarget.style.borderRadius = '16px'; } }}
              onMouseLeave={(e) => { if (activeImage !== 10) { e.currentTarget.style.boxShadow = '0 0 0 rgba(0,0,0,0)'; e.currentTarget.style.borderRadius = '0'; } }}
            />
          </div>

          {/* Image 12: Rest of R3C5 (increased height) - Bottom Right Corner */}
          <div
            style={{
              gridRow: '10 / 13',
              gridColumn: '5',
              '--slide-x': desktopPuzzleDirections[11].x,
              '--slide-y': desktopPuzzleDirections[11].y,
              '--rotate': desktopPuzzleDirections[11].rotate,
              animationDelay: '1100ms'
            }}
            className={`relative group cursor-pointer overflow-visible rounded-br-3xl puzzle-piece ${desktopGalleryInView ? 'animate-in' : ''} ${activeImage === 11 ? 'z-50' : 'z-0 hover:z-50'}`}
          >
            <img
              src={galleryImages[11]}
              alt="Gallery 12"
              loading="lazy"
              width="800"
              height="600"
              onClick={() => handleImageClick(11)}
              className={`w-full h-full object-cover rounded-br-3xl transition-all duration-500 ease-in-out ${
                activeImage === 11
                  ? 'grayscale-0 brightness-100 scale-125'
                  : 'grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 group-hover:scale-125'
              }`}
              style={{
                boxShadow: activeImage === 11 ? '0 35px 80px 10px rgba(0, 0, 0, 0.9)' : '0 0 0 rgba(0,0,0,0)',
                borderRadius: activeImage === 11 ? '16px' : '0 0 24px 0',
                position: 'relative'
              }}
              onMouseEnter={(e) => { if (activeImage !== null && activeImage !== 11) setActiveImage(null); if (activeImage !== 11) { e.currentTarget.style.boxShadow = '0 35px 80px 10px rgba(0, 0, 0, 0.9)'; e.currentTarget.style.borderRadius = '16px'; } }}
              onMouseLeave={(e) => { if (activeImage !== 11) { e.currentTarget.style.boxShadow = '0 0 0 rgba(0,0,0,0)'; e.currentTarget.style.borderRadius = '0 0 24px 0'; } }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Gallery;
