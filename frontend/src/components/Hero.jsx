import { useState, useEffect } from 'react';
import { useOnLoad } from '../hooks/useOnLoad';
import { usePageContent } from '../hooks/usePageContent';
import { prepareHtml } from '../utils/htmlUtils';
import api from '../services/api';

const Hero = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [key, setKey] = useState(0);
  const [images, setImages] = useState([]);
  const hasLoaded = useOnLoad(300); // 300ms delay (after navbar)
  const { content } = usePageContent();

  // Fetch slider images from API (with time-based caching to prevent reloads)
  useEffect(() => {
    const cacheKey = 'slider_images';
    const cacheTimeKey = 'slider_images_time';
    const cached = sessionStorage.getItem(cacheKey);
    const cacheTime = sessionStorage.getItem(cacheTimeKey);

    // Cache expires after 30 seconds
    const CACHE_DURATION = 30 * 1000; // 30 seconds
    const now = Date.now();

    if (cached && cacheTime && (now - parseInt(cacheTime)) < CACHE_DURATION) {
      try {
        const cachedImages = JSON.parse(cached);
        setImages(cachedImages);
        return;
      } catch {
        // Invalid cache, continue to fetch
      }
    }

    async function fetchImages() {
      try {
        const data = await api.getSliderImages();
        setImages(data);

        // Cache in sessionStorage with timestamp
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
        sessionStorage.setItem(cacheTimeKey, now.toString());
      } catch (error) {
        console.error('Failed to load slider images:', error);
        setImages([]);
      }
    }
    fetchImages();
  }, []);

  const slideDuration = 5000; // 5 seconds per slide

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          const nextIndex = (currentImageIndex + 1) % images.length;
          setCurrentImageIndex(nextIndex);
          setKey((k) => k + 1); // Force remount
          return 0;
        }
        return prev + (100 / (slideDuration / 50)); // Update every 50ms
      });
    }, 50);

    return () => clearInterval(interval);
  }, [images.length, currentImageIndex]);

  return (
    <section id="home" className="relative h-screen w-full overflow-hidden">
      {/* Background Images with Overlay */}
      <div className="absolute inset-0">
        {images.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={image.cdn_url || image}
              alt={`Slide ${index + 1}`}
              className="w-full h-full object-cover"
              width="1920"
              height="1080"
              loading={index === 0 ? 'eager' : 'lazy'}
              fetchPriority={index === 0 ? 'high' : 'auto'}
              style={{
                objectPosition: image.object_position || 'center center'
              }}
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* Content */}
      <div className="relative h-full flex items-end pb-28 md:pb-32 lg:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-3xl text-center md:text-left mx-auto md:mx-0">
            <h1
              className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-3 animate-on-load will-animate ${hasLoaded ? 'has-loaded animate-fade-up animation-complete' : ''}`}
              dangerouslySetInnerHTML={prepareHtml(content?.hero_title)}
            ></h1>
            {/* Animated Progress Bar */}
            <div key={key} className={`w-20 h-2.5 bg-white/30 rounded-full overflow-hidden mx-auto md:mx-0 animate-on-load ${hasLoaded ? 'has-loaded animate-fade-up' : ''}`} style={{ animationDelay: '0.2s' }}>
              <div
                className="h-full bg-white"
                style={{
                  width: `${progress}%`,
                  transition: 'width 50ms linear'
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
