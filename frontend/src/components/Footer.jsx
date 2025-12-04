const Footer = () => {
  return (
    <footer id="contact" className="bg-black text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left - Logo and Branding */}
          <div>
            <div className="flex items-center mb-4">
              <svg className="h-10 w-10" viewBox="0 0 50 50" fill="none">
                <path d="M25 5 L45 15 L35 45 L25 40 L15 45 L5 15 Z" fill="#fff" />
              </svg>
              <div className="ml-2">
                <div className="text-lg font-bold tracking-tight">AGILE</div>
                <div className="text-xs tracking-wider">PRODUCTIONS</div>
              </div>
            </div>
          </div>

          {/* Right - Contact Info */}
          <div className="md:text-right">
            <p className="text-sm mb-2">+91 86085 88266</p>
            <p className="text-sm mb-2">hello@agileproductions.in</p>
            <p className="text-sm">
              No.123/4, Subramanianagar, 4th Street Rd,<br />
              Kodambakkam, Chennai, Tamil Nadu - 600024
            </p>
          </div>
        </div>

        {/* Bottom - Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-800 text-center">
          <p className="text-sm text-gray-400">
            Copyright @AgileProductions/2025
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
