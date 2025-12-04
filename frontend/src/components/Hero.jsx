import { useState, useEffect } from 'react';

const Hero = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [key, setKey] = useState(0);

  const images = [
    "/slide1.jpg",
    "/slide2.jpg",
    "/slide3.jpg"
  ];

  const slideDuration = 5000; // 5 seconds per slide

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          const nextIndex = (currentImageIndex + 1) % images.length;
          console.log('Changing to image:', nextIndex, images[nextIndex]);
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
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* Content */}
      <div className="relative h-full flex items-end pb-16 md:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-3xl text-center md:text-left mx-auto md:mx-0">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-3">
              HOME OF
              <br />
              VISUAL CONTENT
              <br />
              BUILT TO RACE.
            </h1>
            {/* Animated Progress Bar */}
            <div key={key} className="w-20 h-2.5 bg-white/30 rounded-full overflow-hidden mx-auto md:mx-0">
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
