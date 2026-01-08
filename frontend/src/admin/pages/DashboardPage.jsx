import { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useAuth } from '../../context/AuthContext';
import PageContentSection from '../components/PageContentSection';
import SectionImagesSection from '../components/SectionImagesSection';
import SliderSection from '../components/SliderSection';
import GallerySection from '../components/GallerySection';
import LogosSection from '../components/LogosSection';
import UsageSection from '../components/UsageSection';
import UsersSection from '../components/UsersSection';
import ActivityLogSection from '../components/ActivityLogSection';
import RegionManagementSection from '../components/RegionManagementSection';
import ProfileDropdown from '../components/ProfileDropdown';
import RegionSwitcher from '../components/RegionSwitcher';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user } = useAuth();
  const isSuperAdmin = user?.isSuperAdmin;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
              <span className="text-gray-400">|</span>
              <span className="text-sm text-gray-600">Agile Productions</span>
            </div>
            <div className="flex items-center space-x-4">
              <RegionSwitcher />
              <ProfileDropdown />
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </button>
            {isSuperAdmin && (
              <>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'users'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Users
                </button>
                <button
                  onClick={() => setActiveTab('activity-log')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'activity-log'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Activity Log
                </button>
                <button
                  onClick={() => setActiveTab('regions')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'regions'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Regions
                </button>
              </>
            )}
            <button
              onClick={() => setActiveTab('usage')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'usage'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Usage
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <DndProvider backend={HTML5Backend}>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Hero Slider Section */}
              <SliderSection />

              {/* Gallery Section */}
              <GallerySection />

              {/* Client Logos Section */}
              <LogosSection />

              {/* Page Content Section */}
              <PageContentSection />

              {/* Section Images Section */}
              <SectionImagesSection />
            </div>
          )}

          {activeTab === 'users' && isSuperAdmin && <UsersSection />}

          {activeTab === 'activity-log' && isSuperAdmin && <ActivityLogSection />}

          {activeTab === 'regions' && isSuperAdmin && <RegionManagementSection />}

          {activeTab === 'usage' && <UsageSection />}
        </main>
      </DndProvider>
    </div>
  );
}
