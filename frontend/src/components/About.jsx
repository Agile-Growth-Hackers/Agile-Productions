import { useInView } from '../hooks/useInView';
import { usePageContent } from '../hooks/usePageContent';
import { prepareHtml, stripHtmlTags } from '../utils/htmlUtils';

const About = () => {
  const { content } = usePageContent();
  const [titleRef, titleInView] = useInView({ threshold: 0.5 });
  const [content1Ref, content1InView] = useInView({ threshold: 0.5, delay: 100 });
  const [content2Ref, content2InView] = useInView({ threshold: 0.5, delay: 200 });

  return (
    <section id="about-us" className="py-16 md:py-24 bg-[#ECEDF0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2
          ref={titleRef}
          className={`text-5xl md:text-6xl font-bold text-center mb-12 uppercase will-animate ${titleInView ? 'animate-fade-up animation-complete' : ''}`}
        >
          {stripHtmlTags(content?.about_title)}
        </h2>

        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div
            ref={content1Ref}
            className={`text-lg md:text-xl text-black leading-relaxed font-bold will-animate ${content1InView ? 'animate-fade-up animation-complete' : ''}`}
            style={{ textTransform: 'none', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}
            dangerouslySetInnerHTML={prepareHtml(content?.about_tagline)}
          />

          <div
            ref={content2Ref}
            className={`text-base md:text-lg text-black leading-relaxed font-medium will-animate ${content2InView ? 'animate-fade-up animation-complete' : ''}`}
            style={{ textTransform: 'none', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}
            dangerouslySetInnerHTML={prepareHtml(content?.about_content)}
          />
        </div>
      </div>
    </section>
  );
};

export default About;
