'use client';

import ProtectedRoute from './components/ProtectedRoute';
import { RegionProvider } from '../context/RegionContext';
import DashboardPage from './pages/DashboardPage';

export default function AdminApp() {
  return (
    <ProtectedRoute>
      <RegionProvider>
        <DashboardPage />
      </RegionProvider>
    </ProtectedRoute>
  );
}
