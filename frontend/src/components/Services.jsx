import { useState } from 'react';

const Services = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section id="services" className="pt-8 pb-8 md:pt-12 md:pb-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* We Are Known For */}
        <div className="mb-16">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left - Text Content */}
            <div>
              <h2 className="text-5xl md:text-6xl font-bold mb-8 text-center lg:text-left">
                WE ARE
                <br />
                KNOW FOR
              </h2>
              <ul className="space-y-4 text-lg md:text-xl font-medium mx-auto lg:mx-0 max-w-2xl lg:max-w-none" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}>
                <li className="flex items-start">
                  <span className="text-2xl mr-3">•</span>
                  <span className="text-black">
                    Motorsports Coverage: Track days, Championships,{' '}
                    <span className="hidden lg:inline"><br /></span>
                    behind-the-scenes access
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-2xl mr-3">•</span>
                  <span className="text-black">
                    Automotive Events: Product launches, community rides,{' '}
                    <span className="hidden lg:inline"><br /></span>
                    dealership experiences
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
            <div className="lg:order-last flex justify-center lg:justify-end">
              <img
                src="/known for.png"
                alt="Motorcycle detail"
                className="w-full h-auto max-w-md md:max-w-xl lg:max-w-none"
              />
            </div>
          </div>
        </div>

        {/* Event Coverage */}
        <div className="mb-8 md:mb-0 lg:mb-8 mt-16">
          {/* Mobile/Tablet: Show title above content */}
          <h2 className="text-5xl md:text-6xl font-bold mb-6 text-center lg:hidden">
            EVENT COVERAGE
          </h2>

          {/* Desktop: Image with overlaid title shown first */}
          <div className="hidden lg:block relative mb-5 w-[80%]">
            <img
              src="/event coverage.png"
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
          <div className="max-w-4xl mx-auto xl:mx-0 text-center xl:text-left mb-6 xl:mb-0">
            <p className="text-lg text-black leading-relaxed mb-8 font-medium" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}>
              We specialize in bringing automotive events to life with vibrant footage and emotional
              resonance Malaysian Harley Davidson Gathering, Dosa With Ducati, BMW 1000RR Ride,
              Malaysian Auto Expo, Rynox Store Launch, Sip A Cofftee With 6kiom
            </p>
          </div>

          {/* Mobile/Tablet: Image shown after content */}
          <div className="lg:hidden flex justify-center mt-6">
            <img
              src="/event coverage.png"
              alt="Event coverage"
              className="w-full h-auto max-w-md md:max-w-2xl"
            />
          </div>

          {/* View More Button - Below image on mobile/tablet, below content on desktop */}
          {!isExpanded && (
            <div className="mt-8 md:mt-12 md:-mb-12 lg:mt-0 lg:mb-0 lg:absolute lg:left-0 lg:right-0 flex justify-center">
              <button
                onClick={() => setIsExpanded(true)}
                className="text-white px-16 pt-4 pb-6 font-bold text-xl animate-bounce hover:scale-110 hover:animate-none transition-transform duration-300 ease-in-out"
                style={{
                  backgroundImage: 'url(/view.png)',
                  backgroundSize: '100% 100%',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  width: 'fit-content',
                  minWidth: '250px'
                }}
              >
                VIEW MORE
              </button>
            </div>
          )}
        </div>

        {/* Expandable Content */}
        <div
          className={`overflow-hidden transition-all duration-500 ease-in-out ${
            isExpanded ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          {/* Ad & Promo Films */}
          <div className="mb-16 mt-8 md:mt-16 relative">
            {/* Content above image */}
            <div className="relative z-10 mb-2">
              <h2 className="text-5xl md:text-6xl font-bold mb-6 text-center lg:text-left">
                AD & PROMO FILMS
              </h2>
              <p className="text-lg text-black leading-relaxed mb-8 max-w-3xl mx-auto lg:mx-0 md:pl-16 lg:pl-0 font-medium text-left" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}>
                We craft ad films that fuel your brand's presence
              </p>
              <ul className="space-y-3 text-lg text-black mb-2 max-w-3xl mx-auto lg:mx-0 md:pl-16 lg:pl-0 font-medium text-left" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}>
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
            <div className="flex justify-center relative -mt-12 md:-mt-28 lg:-mt-40">
              <img
                src="/ad-promo.png"
                alt="Ad & Promo Films"
                className="w-full h-auto max-w-6xl"
              />
            </div>
          </div>

          {/* Brand Coverage */}
          <div className="mb-4 md:mb-0 lg:mb-4 lg:mt-24">
            <h2 className="text-5xl md:text-6xl font-bold mb-4 text-center lg:text-right">
              BRAND COVERAGE
            </h2>
            <p className="text-lg text-black leading-relaxed mb-6 lg:mb-10 max-w-3xl mx-auto lg:ml-auto lg:mr-0 font-medium text-center lg:text-right" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}>
              We create powerful visuals for automotive brands like Lexus, Ultraviolette, Ducati and more
              capturing their identity, performance, and lifestyle with impact.
            </p>

            {/* Brand Coverage Collage - Desktop & Tablet */}
            <div className="hidden md:flex justify-center">
              <img
                src="/brand-coverage-desktop.png"
                alt="Brand Coverage"
                className="w-full h-auto"
              />
            </div>

            {/* Brand Coverage Collage - Mobile */}
            <div className="md:hidden flex justify-center">
              <img
                src="/brand-coverage-mobile.png"
                alt="Brand Coverage"
                className="w-full h-auto max-w-md"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;
