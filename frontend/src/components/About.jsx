const About = () => {
  return (
    <section id="about-us" className="py-16 md:py-24 bg-[#ECEDF0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-5xl md:text-6xl font-bold text-center mb-12 uppercase">
          About Us
        </h2>

        <div className="max-w-4xl mx-auto text-center space-y-6">
          <p className="text-lg md:text-xl text-black leading-relaxed font-medium" style={{ textTransform: 'none', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}>
            We are speed chasers, storytellers, and visual engineers for the fast lane.
          </p>

          <p className="text-base md:text-lg text-black leading-relaxed font-medium" style={{ textTransform: 'none', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}>
            Born at the crossroads of horsepower and{' '}
            <span className="hidden lg:inline"><br /></span>
            creativity, we specialize in capturing the untamed energy of motorsports and the raw{' '}
            <span className="hidden lg:inline"><br /></span>
            passion behind every automotive event. Whether it's the roar of a superbike at the apex,{' '}
            <span className="hidden lg:inline"><br /></span>
            the freedom of a long ride shared with a pack, or the intimate silence of a key handover at a showroom,{' '}
            <span className="hidden lg:inline"><br /></span>
            we transform fleeting moments into lasting cinematic experiences that resonate deeply with your audience.
          </p>

          <p className="text-base md:text-lg text-black leading-relaxed font-medium" style={{ textTransform: 'none', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}>
            At Agile, every frame we shoot is built to race bold, precise, and impossible to ignore.
          </p>
        </div>
      </div>
    </section>
  );
};

export default About;
