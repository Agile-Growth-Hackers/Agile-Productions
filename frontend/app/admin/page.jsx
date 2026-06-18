'use client';

import dynamic from 'next/dynamic';

const AdminApp = dynamic(
  () => import('../../src/admin/AdminApp'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    ),
  }
);

export default function AdminPage() {
  return <AdminApp />;
}
