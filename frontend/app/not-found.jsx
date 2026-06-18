'use client';

import Navbar from '../src/components/Navbar';
import Hero from '../src/components/Hero';
import About from '../src/components/About';
import KnownFor from '../src/components/sections/KnownFor';
import Motorsports from '../src/components/sections/Motorsports';
import EventCoverage from '../src/components/sections/EventCoverage';
import BrandCoverage from '../src/components/sections/BrandCoverage';
import AdPromoFilms from '../src/components/sections/AdPromoFilms';
import VehicleDelivery from '../src/components/sections/VehicleDelivery';
import Crew from '../src/components/sections/Crew';
import Gallery from '../src/components/Gallery';
import Clients from '../src/components/Clients';
import Footer from '../src/components/Footer';

export default function NotFound() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <About />
        <KnownFor />
        <Motorsports />
        <EventCoverage />
        <BrandCoverage />
        <AdPromoFilms />
        <VehicleDelivery />
        <Crew />
        <Gallery />
        <Clients />
      </main>
      <Footer />
    </div>
  );
}
