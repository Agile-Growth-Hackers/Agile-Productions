import { useInView } from '../hooks/useInView';

const Services = () => {
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
              <h2 className="text-5xl md:text-6xl font-bold mb-8 text-center lg:text-left">
                WE ARE
                <br />
                KNOWN FOR
              </h2>
              <ul className="space-y-4 text-base md:text-lg lg:text-xl font-medium mx-auto lg:mx-0 max-w-2xl lg:max-w-none" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}>
                <li className="flex items-start">
                  <span className="text-2xl mr-3">•</span>
                  <span className="text-black">
                    Motorsports Coverage: Track days, Championships,{' '}
                    <span className="hidden lg:inline"><br /></span>
                    Behind-The-Scenes
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-2xl mr-3">•</span>
                  <span className="text-black">
                    Automotive Events: Product launches, Community Rides,{' '}
                    <span className="hidden lg:inline"><br /></span>
                    Dealership Experiences
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-2xl mr-3">•</span>
                  <span className="text-black">
                    Ad Films & Commercials: High-quality promotional{' '}
                    <span className="hidden lg:inline"><br /></span>
                    videos designed for engagement
                  </span>
                </li>
              </ul>
            </div>

            {/* Right - Image */}
            <div
              ref={knownImageRef}
              className={`lg:order-last flex justify-center lg:justify-end will-animate ${knownImageInView ? 'animate-fade-up lg:animate-fade-left animation-complete' : ''}`}
            >
              <img
                src="https://r2.agileproductions.in/site-images/known-for.webp"
                alt="Motorcycle detail"
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
          >
            EVENT COVERAGE
          </h2>

          {/* Desktop: Image with overlaid title shown first */}
          <div
            ref={eventTitleRef}
            className={`hidden lg:block relative mb-5 w-[80%] will-animate ${eventTitleInView ? 'animate-fade-left animation-complete' : ''}`}
          >
            <img
              src="https://r2.agileproductions.in/site-images/event-coverage.webp"
              alt="Event coverage"
              className="w-full h-auto"
            />
            <h2 className="absolute top-[35%] left-[85%] -translate-y-1/2 text-5xl md:text-6xl font-bold text-black">
              EVENT
              <br />
              COVERAGE
            </h2>
          </div>

          {/* Content */}
          <div
            ref={eventContentRef}
            className={`max-w-4xl mx-auto xl:mx-0 text-center xl:text-left mb-6 xl:mb-0 will-animate ${eventContentInView ? 'animate-fade-up lg:animate-fade-right animation-complete' : ''}`}
          >
            <p className="text-base md:text-lg text-black leading-relaxed mb-8 font-medium" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}>
              We specialize in bringing automotive events to life with vibrant footage and emotional
              resonance. Rolls-Royce Private Dinner, Malaysian Harley Davidson Gathering, Dosas With Ducati, BMW 1000RR Ride,
              Malaysian Auto Expo, Rynox Store Launch, Sip A Cofftee With 6kiom
            </p>
          </div>

          {/* Mobile/Tablet: Image shown after content */}
          <div
            ref={eventContentRef}
            className={`lg:hidden flex justify-center mt-6 will-animate ${eventContentInView ? 'animate-fade-up animation-complete' : ''}`}
          >
            <img
              src="https://r2.agileproductions.in/site-images/event-coverage.webp"
              alt="Event coverage"
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
              <h2 className="text-5xl md:text-6xl font-bold mb-6 text-center lg:text-left">
                AD & PROMO FILMS
              </h2>
              <p className="text-base md:text-lg text-black leading-relaxed mb-8 max-w-3xl mx-auto lg:mx-0 md:pl-16 lg:pl-0 font-medium text-left" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}>
                We craft ad films that fuel your brand's presence
              </p>
              <ul className="space-y-3 text-base md:text-lg text-black mb-2 max-w-3xl mx-auto lg:mx-0 md:pl-16 lg:pl-0 font-medium text-left" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}>
                <li className="flex items-start justify-start">
                  <span className="mr-3">•</span>
                  <span>Instagram Reels, Shorts & YouTube Ads</span>
                </li>
                <li className="flex items-start justify-start">
                  <span className="mr-3">•</span>
                  <span>Dealer Testimonials with cinematic visuals</span>
                </li>
                <li className="flex items-start justify-start">
                  <span className="mr-3">•</span>
                  <span>Campaigns for automotive brands and gear companies</span>
                </li>
              </ul>
            </div>

            {/* Ad & Promo Collage - Image overlays bottom of text */}
            <div
              ref={adImageRef}
              className={`flex justify-center relative -mt-12 md:-mt-28 lg:-mt-40 will-animate ${adImageInView ? 'animate-fade-up lg:animate-fade-left animation-complete' : ''}`}
            >
              <img
                src="https://r2.agileproductions.in/site-images/ad-promo.webp"
                alt="Ad & Promo Films"
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
              <h2 className="text-5xl md:text-6xl font-bold mb-4 text-center lg:text-right">
              BRAND COVERAGE
            </h2>
            <p className="text-base md:text-lg text-black leading-relaxed mb-6 lg:mb-10 max-w-3xl mx-auto lg:ml-auto lg:mr-0 font-medium text-center lg:text-right" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}>
              We create powerful visuals for automotive brands like Rolls-Royce, Bentley, Lexus, Ultraviolette, Ducati and more
              capturing their identity, performance, and lifestyle with impact.
            </p>
            </div>

            {/* Brand Coverage Collage - Desktop & Tablet */}
            <div
              ref={brandImageRef}
              className={`hidden md:flex justify-center will-animate ${brandImageInView ? 'animate-fade-up lg:animate-fade-right animation-complete' : ''}`}
            >
              <img
                src="https://r2.agileproductions.in/site-images/brand-coverage-desktop.webp"
                alt="Brand Coverage"
                className="w-full h-auto"
              />
            </div>

            {/* Brand Coverage Collage - Mobile */}
            <div
              ref={brandImageRef}
              className={`md:hidden flex justify-center will-animate ${brandImageInView ? 'animate-fade-up animation-complete' : ''}`}
            >
              <img
                src="https://r2.agileproductions.in/site-images/brand-coverage-mobile.webp"
                alt="Brand Coverage"
                className="w-full h-auto max-w-md"
              />
            </div>
          </div>
        </div>
    </section>
  );
};

export default Services;
