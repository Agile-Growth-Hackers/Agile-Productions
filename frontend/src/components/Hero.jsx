import { useState, useEffect } from 'react';
import { useOnLoad } from '../hooks/useOnLoad';

const Hero = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [key, setKey] = useState(0);
  const hasLoaded = useOnLoad(300); // 300ms delay (after navbar)

  const images = [
    "/slide1.webp",
    "/slide2.webp",
    "/slide3.webp"
  ];

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
              src={image}
              alt={`Slide ${index + 1}`}
              className="w-full h-full object-cover"
              style={{
                objectPosition: index === 0 ? '72% center' : 'center center'
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
            <h1 className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-3 animate-on-load will-animate ${hasLoaded ? 'has-loaded animate-fade-up animation-complete' : ''}`}>
              HOME OF
              <br />
              VISUAL CONTENT
              <br />
              BUILT TO RACE.
            </h1>
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
