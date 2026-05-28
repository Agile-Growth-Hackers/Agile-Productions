import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './context/AuthContext';
import { RegionProvider } from './context/RegionContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Gallery from './components/Gallery';
import Clients from './components/Clients';
import Footer from './components/Footer';
import ErrorTest from './components/ErrorTest';
import KnownFor from './components/sections/KnownFor';
import Motorsports from './components/sections/Motorsports';
import EventCoverage from './components/sections/EventCoverage';
import BrandCoverage from './components/sections/BrandCoverage';
import AdPromoFilms from './components/sections/AdPromoFilms';
import VehicleDelivery from './components/sections/VehicleDelivery';
import Crew from './components/sections/Crew';

// Lazy load admin pages
const LoginPage = lazy(() => import('./admin/pages/LoginPage'));
const DashboardPage = lazy(() => import('./admin/pages/DashboardPage'));
const ProtectedRoute = lazy(() => import('./admin/components/ProtectedRoute'));

function PublicSite() {
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

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Admin routes - must be defined before catch-all */}
            <Route
              path="/admin/login"
              element={
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                  <LoginPage />
                </Suspense>
              }
            />
            <Route
              path="/admin"
              element={
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                  <ProtectedRoute>
                    <RegionProvider>
                      <DashboardPage />
                    </RegionProvider>
                  </ProtectedRoute>
                </Suspense>
              }
            />

            {/* Public site - both root and any regional routes */}
            <Route path="/" element={<PublicSite />} />
            <Route path="*" element={<PublicSite />} />
          </Routes>
          {/* Test button - only shows in development */}
          {import.meta.env.DEV && <ErrorTest />}
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
