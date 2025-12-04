const Clients = () => {
  // Client logos with correct file extensions
  const logoExtensions = {
    1: 'PNG', 2: 'png', 3: 'png', 4: 'png', 5: 'png', 6: 'png', 7: 'png', 8: 'png',
    9: 'jpg', 10: 'png', 11: 'png', 12: 'png', 13: 'jpg', 14: 'avif',
    15: 'avif', 16: 'svg', 17: 'png', 18: 'png', 19: 'png', 20: 'avif',
    21: 'png', 22: 'avif', 23: 'avif', 24: 'avif', 25: 'avif', 26: 'png'
  };

  // Individual logo sizes (in pixels) - adjust each logo size here
  const logoSizes = {
    1: 65, 2: 45, 3: 60, 4: 35, 5: 35, 6: 50, 7: 70, 8: 70,
    9: 60, 10: 40, 11: 50, 12: 25, 13: 35, 14: 30,
    15: 50, 16: 30, 17: 35, 18: 56, 19: 56, 20: 30,
    21: 50, 22: 60, 23: 60, 24: 60, 25: 50, 26: 36
  };

  const clients = Array.from({ length: 26 }, (_, i) => ({
    name: `Client ${i + 1}`,
    logo: `/logos/${i + 1}.${logoExtensions[i + 1]}`,
    size: logoSizes[i + 1]
  }));

  return (
    <section id="clients" className="-mt-26 pt-12 pb-16 md:mt-0 md:pt-16 md:pb-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-5xl md:text-6xl font-bold text-center mb-12">
          CLIENTS
        </h2>

        {/* Client Logos Grid - Pyramid Style */}
        <div className="space-y-6 md:space-y-8">
          {/* Row 1: Clients 1-8 (Longest) */}
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {clients.slice(0, 8).map((client, index) => (
              <div
                key={index}
                className="flex items-center justify-center"
              >
                <img
                  src={client.logo}
                  alt={client.name}
                  className="w-auto object-contain hover:scale-110 transition-transform"
                  style={{ height: `${client.size}px` }}
                />
              </div>
            ))}
          </div>

          {/* Row 2: Clients 9-14 (Shorter) */}
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10">
            {clients.slice(8, 14).map((client, index) => (
              <div
                key={index + 8}
                className="flex items-center justify-center"
              >
                <img
                  src={client.logo}
                  alt={client.name}
                  className="w-auto object-contain hover:scale-110 transition-transform"
                  style={{ height: `${client.size}px` }}
                />
              </div>
            ))}
          </div>

          {/* Row 3: Clients 15-20 (Even Shorter) */}
          <div className="flex flex-wrap justify-center items-center gap-5 md:gap-8">
            {clients.slice(14, 20).map((client, index) => (
              <div
                key={index + 14}
                className="flex items-center justify-center"
              >
                <img
                  src={client.logo}
                  alt={client.name}
                  className="w-auto object-contain hover:scale-110 transition-transform"
                  style={{ height: `${client.size}px` }}
                />
              </div>
            ))}
          </div>

          {/* Row 4: Clients 21-26 (Shortest) */}
          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6">
            {clients.slice(20, 26).map((client, index) => (
              <div
                key={index + 20}
                className="flex items-center justify-center"
              >
                <img
                  src={client.logo}
                  alt={client.name}
                  className="w-auto object-contain hover:scale-110 transition-transform"
                  style={{ height: `${client.size}px` }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Clients;
