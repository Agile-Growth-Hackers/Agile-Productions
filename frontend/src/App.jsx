import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './context/AuthContext';
import { RegionProvider } from './context/RegionContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Services from './components/Services';
import Gallery from './components/Gallery';
import Clients from './components/Clients';
import Footer from './components/Footer';
import ErrorTest from './components/ErrorTest';

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
        <Services />
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
            <Route path="/" element={<PublicSite />} />
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
          </Routes>
          {/* Test button - only shows in development */}
          {import.meta.env.DEV && <ErrorTest />}
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
