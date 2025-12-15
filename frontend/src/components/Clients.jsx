import { useState } from 'react';
import { useInView } from '../hooks/useInView';

const Clients = () => {
  // Track number of pages loaded for each device type
  const [mobilePages, setMobilePages] = useState(1);
  const [tabletPages, setTabletPages] = useState(1);
  const [desktopPages, setDesktopPages] = useState(1);

  // Animation refs
  const [titleRef, titleInView] = useInView({ threshold: 0.5 });
  const [gridRef, gridInView] = useInView({ threshold: 0.3 });

  // Dynamically import all WebP logos from the logos folder
  const logoModules = import.meta.glob('/public/logos/*.webp', { eager: true, as: 'url' });

  // Convert to array and extract file names
  const clients = Object.keys(logoModules)
    .map(path => {
      const fileName = path.split('/').pop().replace('.webp', '');
      return {
        name: fileName,
        logo: `/logos/${fileName}.webp`,
        path: logoModules[path]
      };
    })
    .sort((a, b) => {
      // Sort numerically if both are numbers, otherwise alphabetically
      const aNum = parseInt(a.name);
      const bNum = parseInt(b.name);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
      }
      return a.name.localeCompare(b.name);
    });

  // Logos per page (per device)
  // Mobile: 9 rows × 3 columns = 27 logos per page
  // Tablet: 7 rows × 4 columns = 28 logos per page
  // Desktop: 5 rows × 6 columns = 30 logos per page
  const mobilePerPage = 27;
  const tabletPerPage = 28;
  const desktopPerPage = 30;

  // Calculate how many logos to display for each device
  const mobileDisplayCount = mobilePages * mobilePerPage;
  const tabletDisplayCount = tabletPages * tabletPerPage;
  const desktopDisplayCount = desktopPages * desktopPerPage;

  // Get logos to display for each device
  const mobileClients = clients.slice(0, mobileDisplayCount);
  const tabletClients = clients.slice(0, tabletDisplayCount);
  const desktopClients = clients.slice(0, desktopDisplayCount);

  // Check if there are more logos to load
  const hasMobileMore = clients.length > mobileDisplayCount;
  const hasTabletMore = clients.length > tabletDisplayCount;
  const hasDesktopMore = clients.length > desktopDisplayCount;

  return (
    <section id="clients" className="-mt-20 pt-12 md:-mt-0 md:pt-12 lg:pt-16 pb-16 md:pb-24 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 md:mb-12 lg:mb-16">
          <h2
            ref={titleRef}
            className={`text-5xl md:text-6xl font-bold text-center will-animate ${titleInView ? 'animate-fade-up animation-complete' : ''}`}
          >
            CLIENTS
          </h2>
        </div>

        {/* Mobile Grid: Pagination - 27 logos per page (9 rows × 3 columns) */}
        <div ref={gridRef} className="md:hidden grid grid-cols-3 gap-4">
          {mobileClients.map((client, index) => (
            <div
              key={client.name}
              className={`flex items-center justify-center bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-3 hover:scale-105 w-full h-20 will-animate ${gridInView ? 'animate-fade-up animation-complete' : ''}`}
              style={{ animationDelay: `${Math.min(index * 80, 1200)}ms` }}
            >
              <img
                src={client.logo}
                alt={client.name}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ))}
        </div>

        {/* Tablet Grid: Pagination - 28 logos per page (7 rows × 4 columns) */}
        <div ref={gridRef} className="hidden md:grid lg:hidden grid-cols-4 gap-5">
          {tabletClients.map((client, index) => (
            <div
              key={client.name}
              className={`flex items-center justify-center bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-4 hover:scale-105 w-full h-24 will-animate ${gridInView ? 'animate-fade-up animation-complete' : ''}`}
              style={{ animationDelay: `${Math.min(index * 80, 1200)}ms` }}
            >
              <img
                src={client.logo}
                alt={client.name}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ))}
        </div>

        {/* Desktop Grid: Pagination - 30 logos per page (5 rows × 6 columns) */}
        <div ref={gridRef} className="hidden lg:grid grid-cols-6 gap-6">
          {desktopClients.map((client, index) => (
            <div
              key={client.name}
              className={`flex items-center justify-center bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 hover:scale-105 w-full h-28 will-animate ${gridInView ? 'animate-fade-up animation-complete' : ''}`}
              style={{ animationDelay: `${Math.min(index * 80, 1200)}ms` }}
            >
              <img
                src={client.logo}
                alt={client.name}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ))}
        </div>

        {/* View More Button - Mobile */}
        {hasMobileMore && (
          <div className="md:hidden flex justify-center mt-8">
            <button
              onClick={() => setMobilePages(prev => prev + 1)}
              className="text-white px-16 pt-4 pb-6 font-bold text-xl animate-bounce hover:scale-110 hover:animate-none transition-transform duration-300 ease-in-out"
              style={{
                backgroundImage: 'url(/view.webp)',
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

        {/* View More Button - Tablet */}
        {hasTabletMore && (
          <div className="hidden md:flex lg:hidden justify-center mt-10">
            <button
              onClick={() => setTabletPages(prev => prev + 1)}
              className="text-white px-16 pt-4 pb-6 font-bold text-xl animate-bounce hover:scale-110 hover:animate-none transition-transform duration-300 ease-in-out"
              style={{
                backgroundImage: 'url(/view.webp)',
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

        {/* View More Button - Desktop */}
        {hasDesktopMore && (
          <div className="hidden lg:flex justify-center mt-12">
            <button
              onClick={() => setDesktopPages(prev => prev + 1)}
              className="text-white px-16 pt-4 pb-6 font-bold text-xl animate-bounce hover:scale-110 hover:animate-none transition-transform duration-300 ease-in-out"
              style={{
                backgroundImage: 'url(/view.webp)',
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
    </section>
  );
};

export default Clients;
