const Footer = () => {
  return (
    <footer id="contact" className="bg-black text-white relative -mt-[1px]">
      {/* Curved Step Down Transition */}
      <div className="w-full overflow-hidden leading-[0] -mb-1 bg-black">
        <svg className="relative block w-full h-[65px] md:h-[85px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 85" preserveAspectRatio="none">
          {/* Grey top section - extends beyond top */}
          <path d="M0,-5 L720,-5 L720,0 C730,0 745,8 755,20 C765,32 775,42 785,48 C790,50 792,50 795,50 L1200,50 L1200,-5 Z" fill="#ECEDF0"></path>
          {/* Black footer section with step down */}
          <path d="M0,15 L720,15 C730,15 745,25 755,40 C765,55 775,70 785,78 C790,82 792,85 795,85 L1200,85 L1200,85 L0,85 Z" className="fill-black"></path>
        </svg>
      </div>
      <div className="pt-1 pb-12 md:pt-2 md:pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-8 md:items-end">
          {/* Left - Logo and Contact */}
          <div>
            <img
              src="/white AP logo.png"
              alt="Agile Productions Logo"
              className="h-12 w-auto mb-4"
            />
            <p className="text-sm text-gray-300 mb-1" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}>
              <a href="tel:+918608686286" className="hover:text-white transition-colors">+91 86086 86286</a>
            </p>
            <p className="text-sm text-gray-300 mb-1" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}>
              <a href="mailto:hello@agilegrowthhackers.in" className="hover:text-white transition-colors">hello@agilegrowthhackers.in</a>
            </p>
            <p className="text-sm text-gray-300" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}>
              213, 2nd Floor, Ramnashree Arcade, MG Road, Bangalore - 560001
            </p>
          </div>

          {/* Right - Copyright */}
          <div className="text-center md:text-right mt-6 md:mt-0">
            <p className="text-sm text-gray-500" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}>
              Copyright @ AgileGrowthHackers2025
            </p>
          </div>
        </div>
      </div>
      </div>
    </footer>
  );
};

export default Footer;
