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
          {stripHtmlTags(content?.about_title, 'About Us')}
        </h2>

        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div
            ref={content1Ref}
            className={`text-lg md:text-xl text-black leading-relaxed font-bold will-animate ${content1InView ? 'animate-fade-up animation-complete' : ''}`}
            style={{ textTransform: 'none', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}
            dangerouslySetInnerHTML={prepareHtml(content?.about_tagline, 'We Are Speed Chasers, Storytellers, And Visual Engineers For The Fast Lane.')}
          />

          <div
            ref={content2Ref}
            className={`text-base md:text-lg text-black leading-relaxed font-medium will-animate ${content2InView ? 'animate-fade-up animation-complete' : ''}`}
            style={{ textTransform: 'none', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}
            dangerouslySetInnerHTML={prepareHtml(content?.about_content, '<p>Born at the crossroads of horsepower and creativity, we specialize in capturing the untamed energy of motorsports and the raw passion behind every automotive event. Whether it\'s the roar of a superbike at the apex, the freedom of a long ride shared with a pack, or the intimate silence of a key handover at a showroom, we transform fleeting moments into lasting cinematic experiences that resonate deeply with your audience.</p><p>At Agile, every frame we shoot is built to race bold, precise, and impossible to ignore.</p>')}
          />
        </div>
      </div>
    </section>
  );
};

export default About;
