'use client';

import dynamic from 'next/dynamic';

const LoginPage = dynamic(
  () => import('../../../src/admin/pages/LoginPage'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    ),
  }
);

export default function AdminLoginPage() {
  return <LoginPage />;
}
