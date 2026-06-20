import { headers } from 'next/headers';
import { getCloudflareContext } from '@opennextjs/cloudflare';

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
import ErrorTest from '../src/components/ErrorTest';

// Server-render the above-the-fold hero data (title + slider images) so the LCP
// content is present in the initial HTML — no client-fetch wait. Region is
// derived from the request host (the API resolves region by domain), so IN/AE
// stay correct per domain. If anything fails, we fall back to null/[] and the
// client fetch takes over exactly as before — nothing breaks.
async function getHeroInitialData() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL;
  if (!apiBase) return { content: null, slides: [] };

  let host = '';
  try {
    const h = await headers();
    host = h.get('host') || '';
  } catch {
    /* headers unavailable — fall through with no Origin */
  }
  const reqHeaders = host ? { Origin: `https://${host}` } : {};

  // Prefer the direct service binding — a plain fetch to the API's workers.dev
  // URL loops back to this very worker (same subdomain) and 404s. The binding
  // calls the API worker directly. Falls back to public fetch if unavailable.
  let apiBinding = null;
  try {
    const ctx = await getCloudflareContext({ async: true });
    apiBinding = ctx?.env?.WORKER_API || null;
  } catch {
    /* binding unavailable (e.g. local dev) — fall back to public fetch */
  }

  const fetchJson = async (path, fallback) => {
    try {
      const url = `${apiBase}${path}`;
      const res = apiBinding
        ? await apiBinding.fetch(new Request(url, { headers: reqHeaders }))
        : await fetch(url, { headers: reqHeaders, cache: 'no-store' });
      if (!res.ok) return fallback;
      return await res.json();
    } catch {
      return fallback;
    }
  };

  const content = await fetchJson('/api/page-content', null);
  const slidesData = await fetchJson('/api/slider', []);
  return { content, slides: Array.isArray(slidesData) ? slidesData : [] };
}

export default async function Home() {
  const { content, slides } = await getHeroInitialData();
  const firstSlide =
    slides[0]?.cdn_url || (typeof slides[0] === 'string' ? slides[0] : null);

  return (
    <div className="min-h-screen">
      {/* Preload the first hero image so it starts downloading immediately. */}
      {firstSlide && (
        <link rel="preload" as="image" href={firstSlide} fetchPriority="high" />
      )}
      <Navbar />
      <main>
        <Hero initialContent={content} initialSlides={slides} />
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
      {process.env.NODE_ENV === 'development' && <ErrorTest />}
    </div>
  );
}
