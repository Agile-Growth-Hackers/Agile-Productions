import { useState, useEffect } from 'react';
import { useOnLoad } from '../hooks/useOnLoad';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const hasLoaded = useOnLoad(100); // 100ms delay for smooth entrance

  const menuItems = ['HOME', 'ABOUT US', 'SERVICES', 'GALLERY', 'CONTACT'];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed left-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'top-4' : 'top-0'} animate-on-load ${hasLoaded ? 'has-loaded animate-fade-down' : ''}`}>
      {/* Desktop Navigation */}
      {isScrolled ? (
        <div className="hidden lg:block max-w-7xl mx-auto px-4">
          <div className="h-20 rounded-2xl bg-white/75 shadow-xl border border-white/20 backdrop-blur-lg relative transition-all duration-300">
            <div className="relative z-10 h-full flex items-center justify-between px-10">
              {/* Logo on the left */}
              <div className="flex items-center">
                <a href="#home" className="cursor-pointer">
                  <img
                    src="/Agile Productions Logo.webp"
                    alt="Agile Productions Logo"
                    className="h-10 w-auto object-contain transition-all duration-300"
                  />
                </a>
              </div>

              {/* Menu on the right */}
              <ul className="flex items-center gap-10">
                {menuItems.map((item) => (
                  <li key={item} className="group relative cursor-pointer">
                    <a
                      href={`#${item.toLowerCase().replace(' ', '-')}`}
                      className="text-sm font-bold uppercase tracking-wider text-gray-800 hover:text-gray-600 transition-colors"
                    >
                      {item}
                    </a>
                    <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-gray-800 transition-all duration-300 group-hover:w-full"></span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden lg:block relative h-[120px] transition-all duration-300">
          {/* Transparent background layer (full width) */}
          <div className="absolute inset-0 bg-transparent"></div>

          {/* White overlay with dramatic S-curve on LEFT side */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Normal screens - S-curve at x=550 */}
            <path
              className="block 2xl:hidden"
              d="M 1440 0 L 1440 21 L 550 21 C 510 21 505 51 502 73 C 499 94 490 120 460 120 L 0 120 L 0 0 Z"
              fill="white"
            />
            {/* Ultrawide screens - S-curve at x=700 */}
            <path
              className="hidden 2xl:block"
              d="M 1440 0 L 1440 21 L 700 21 C 660 21 655 51 652 73 C 649 94 640 120 610 120 L 0 120 L 0 0 Z"
              fill="white"
            />
          </svg>

          {/* Content layer */}
          <div className="relative z-10 h-full max-w-7xl mx-auto px-10">
            <div className="flex items-center justify-between h-full">
              {/* Logo on the left - constrained width */}
              <div className="flex items-center flex-shrink-0 pr-8">
                <a href="#home" className="cursor-pointer">
                  <img
                    src="/Agile Productions Logo.webp"
                    alt="Agile Productions Logo"
                    className="h-20 w-auto object-contain"
                    style={{ maxWidth: '350px' }}
                  />
                </a>
              </div>

              {/* Menu on the right */}
              <ul className="flex items-center gap-10 flex-shrink-0">
                {menuItems.map((item) => (
                  <li key={item} className="group relative cursor-pointer">
                    <a
                      href={`#${item.toLowerCase().replace(' ', '-')}`}
                      className="text-sm font-bold uppercase tracking-wider text-white hover:text-gray-200 transition-colors"
                    >
                      {item}
                    </a>
                    <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Navigation (< 768px) */}
      <div className={`md:hidden relative transition-all duration-300 ${
        isScrolled
          ? 'h-16 mx-2 rounded-2xl bg-white/75 shadow-xl border border-white/20 backdrop-blur-lg'
          : 'h-20'
      }`}>
        {!isScrolled && (
          <>
            {/* Transparent background layer */}
            <div className="absolute inset-0 bg-transparent"></div>

            {/* White overlay with S-curve for mobile */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 768 80"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M 768 0 L 768 15 L 340 15 C 310 15 300 35 295 50 C 290 65 280 80 260 80 L 0 80 L 0 0 Z"
                fill="white"
              />
            </svg>
          </>
        )}

        {/* Content layer */}
        <div className="relative z-10 h-full flex justify-between items-center px-4">
          {/* Logo */}
          <div className="flex items-center">
            <a href="#home" className="cursor-pointer">
              <img
                src="/Agile Productions Logo.webp"
                alt="Agile Productions Logo"
                className={`w-auto object-contain transition-all duration-300 ${isScrolled ? 'h-8' : 'h-10'}`}
              />
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className={`p-2 rounded-md focus:outline-none transition-colors ${
              isScrolled
                ? 'text-gray-800 hover:bg-gray-100'
                : 'text-white hover:bg-white/10'
            }`}
            aria-label="Toggle menu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 mx-2 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden">
            <div className="px-2 py-3 space-y-1">
              {menuItems.map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(' ', '-')}`}
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-3 text-gray-800 hover:bg-gray-100 font-medium text-sm tracking-wide transition-colors rounded-lg"
                >
                  {item}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tablet Navigation (768px - 1024px) */}
      <div className={`hidden md:block lg:hidden relative transition-all duration-300 ${
        isScrolled
          ? 'h-16 mx-2 rounded-2xl bg-white/75 shadow-xl border border-white/20 backdrop-blur-lg'
          : 'h-20'
      }`}>
        {!isScrolled && (
          <>
            {/* Transparent background layer */}
            <div className="absolute inset-0 bg-transparent"></div>

            {/* White overlay with S-curve for tablet */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 768 80"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M 768 0 L 768 15 L 320 15 C 290 15 280 35 275 50 C 270 65 260 80 240 80 L 0 80 L 0 0 Z"
                fill="white"
              />
            </svg>
          </>
        )}

        {/* Content layer */}
        <div className="relative z-10 h-full flex justify-between items-center px-4">
          {/* Logo */}
          <div className="flex items-center pl-4">
            <a href="#home" className="cursor-pointer">
              <img
                src="/Agile Productions Logo.webp"
                alt="Agile Productions Logo"
                className={`w-auto object-contain transition-all duration-300 ${isScrolled ? 'h-10' : 'h-12'}`}
                style={{ maxWidth: '200px' }}
              />
            </a>
          </div>

          {/* Tablet Menu Button */}
          <button
            onClick={toggleMenu}
            className={`p-2 rounded-md focus:outline-none transition-colors ${
              isScrolled
                ? 'text-gray-800 hover:bg-gray-100'
                : 'text-white hover:bg-white/10'
            }`}
            aria-label="Toggle menu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Tablet Menu Dropdown */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 mx-2 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden">
            <div className="px-2 py-3 space-y-1">
              {menuItems.map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(' ', '-')}`}
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-3 text-gray-800 hover:bg-gray-100 font-medium text-sm tracking-wide transition-colors rounded-lg"
                >
                  {item}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;