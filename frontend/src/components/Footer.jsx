import { useInView } from '../hooks/useInView';
import { usePageContent } from '../hooks/usePageContent';
import { prepareHtml, stripHtmlTags } from '../utils/htmlUtils';

const Footer = () => {
  const { content } = usePageContent();
  const [leftRef, leftInView] = useInView({ threshold: 0.2 });
  const [rightRef, rightInView] = useInView({ threshold: 0.2, delay: 100 });

  return (
    <>
      <style>{`
        .footer-content a {
          color: inherit;
          text-decoration: none;
        }
        .footer-content a:hover {
          color: #ffffff;
          text-decoration: none;
        }
      `}</style>
      <footer id="contact" className="bg-black text-white relative -mt-[1px]">
      {/* Curved Step Down Transition */}
      <div className="w-full overflow-hidden leading-[0] -mb-1 bg-black">
        <svg className="relative block w-full h-[65px] md:h-[85px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 85" preserveAspectRatio="none">
          {/* Grey top section - extends beyond top */}
          <path d="M0,-5 L720,-5 L720,0 C730,0 745,8 755,20 C765,32 775,42 785,48 C790,50 792,50 795,50 L1200,50 L1200,-5 Z" fill="#f3f4f6"></path>
          {/* Black footer section with step down */}
          <path d="M0,15 L720,15 C730,15 745,25 755,40 C765,55 775,70 785,78 C790,82 792,85 795,85 L1200,85 L1200,85 L0,85 Z" className="fill-black"></path>
        </svg>
      </div>
      <div className="pt-1 pb-12 md:pt-2 md:pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-8 md:items-end">
          {/* Left - Logo and Contact */}
          <div
            ref={leftRef}
            className={`animate-on-scroll will-animate md:${leftInView ? 'is-visible animate-fade-right animation-complete' : ''} ${leftInView ? 'is-visible animate-fade-up animation-complete' : ''} md:opacity-0`}
          >
            <img
              src="https://r2.agileproductions.in/logos/site/white-logo.webp"
              alt="Agile Productions Logo"
              loading="lazy"
              width="200"
              height="48"
              className="h-12 w-auto mb-4"
            />
            <p className="text-sm text-gray-300 mb-1" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}>
              <a href={`tel:${stripHtmlTags(content?.footer_phone, '+91 86086 86286').replace(/\s/g, '')}`} className="hover:text-white transition-colors">
                {stripHtmlTags(content?.footer_phone, '+91 86086 86286')}
              </a>
            </p>
            <p className="text-sm text-gray-300 mb-1" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}>
              <a href={`mailto:${stripHtmlTags(content?.footer_email, 'hello@agilegrowthhackers.in')}`} className="hover:text-white transition-colors">
                {stripHtmlTags(content?.footer_email, 'hello@agilegrowthhackers.in')}
              </a>
            </p>
            <div
              className="text-sm text-gray-300 footer-content"
              style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}
              dangerouslySetInnerHTML={prepareHtml(content?.footer_address, '213, 2nd Floor, Ramnashree Arcade, MG Road, Bangalore - 560001')}
            />
          </div>

          {/* Right - Copyright */}
          <div
            ref={rightRef}
            className={`text-center md:text-right mt-6 md:mt-0 animate-on-scroll will-animate md:${rightInView ? 'is-visible animate-fade-left animation-complete' : ''} ${rightInView ? 'is-visible animate-fade-up animation-complete' : ''} md:opacity-0`}
          >
            <div
              className="text-sm text-gray-400 footer-content"
              style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}
              dangerouslySetInnerHTML={prepareHtml(content?.footer_copyright, 'Copyright @ AgileGrowthHackers2025')}
            />
          </div>
        </div>
      </div>
      </div>
    </footer>
    </>
  );
};

export default Footer;
