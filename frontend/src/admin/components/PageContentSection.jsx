import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useRegion } from '../../context/RegionContext';
import RichTextEditor from './RichTextEditor';
import * as FlagIcons from 'country-flag-icons/react/3x2';

// Define content structure by section
const CONTENT_SECTIONS = {
  hero: {
    title: 'Hero',
    description: 'Main landing page hero content',
    fields: [
      { key: 'hero_title', label: 'Hero Title', placeholder: 'Enter hero title...' }
    ]
  },
  about: {
    title: 'About',
    description: 'About us page content',
    fields: [
      { key: 'about_title', label: 'Title', placeholder: 'Enter about title...' },
      { key: 'about_tagline', label: 'Tagline', placeholder: 'Enter tagline...' },
      { key: 'about_content', label: 'Content', placeholder: 'Enter about content...' }
    ]
  },
  services: {
    title: 'Services',
    description: 'Services and offerings content',
    fields: [
      { key: 'services_known_for_title', label: 'Known For Title', placeholder: 'Enter "Known For" title...' },
      { key: 'services_known_for_items', label: 'Known For Items', placeholder: 'Enter items as HTML list...' },
      { key: 'services_event_coverage_title', label: 'Event Coverage Title', placeholder: 'Enter event coverage title...' },
      { key: 'services_event_coverage_description', label: 'Event Coverage Description', placeholder: 'Enter description...' },
      { key: 'services_ad_films_title', label: 'Ad Films Title', placeholder: 'Enter ad films title...' },
      { key: 'services_ad_films_description', label: 'Ad Films Description', placeholder: 'Enter description...' },
      { key: 'services_brand_coverage_title', label: 'Brand Coverage Title', placeholder: 'Enter brand coverage title...' },
      { key: 'services_brand_coverage_description', label: 'Brand Coverage Description', placeholder: 'Enter description...' }
    ]
  },
  footer: {
    title: 'Footer',
    description: 'Footer contact and copyright info',
    fields: [
      { key: 'footer_phone', label: 'Phone Number', placeholder: 'Enter phone number...' },
      { key: 'footer_email', label: 'Email Address', placeholder: 'Enter email...' },
      { key: 'footer_address', label: 'Address', placeholder: 'Enter address...' },
      { key: 'footer_copyright', label: 'Copyright Text', placeholder: 'Enter copyright text...' }
    ]
  }
};

export default function PageContentSection() {
  const { showToast } = useToast();
  const { selectedRegion } = useRegion();
  const [content, setContent] = useState({});
  const [originalContent, setOriginalContent] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('hero'); // Tab state
  const [savingSection, setSavingSection] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState({});

  const fetchContent = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getPageContent(selectedRegion);
      setContent(data);
      setOriginalContent(data);
      setHasUnsavedChanges({});
    } catch (err) {
      setError('Failed to load page content');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedRegion]);

  useEffect(() => {
    if (selectedRegion) {
      fetchContent();
    }
  }, [selectedRegion, fetchContent]);

  const checkSectionChanges = (sectionKey, updatedContent) => {
    const section = CONTENT_SECTIONS[sectionKey];
    const hasChanges = section.fields.some(field => {
      const currentValue = updatedContent[field.key] || '';
      const originalValue = originalContent[field.key] || '';
      return currentValue !== originalValue;
    });

    setHasUnsavedChanges(prev => ({
      ...prev,
      [sectionKey]: hasChanges
    }));
  };

  const handleFieldChange = (fieldKey, value) => {
    setContent(prev => {
      const updated = {
        ...prev,
        [fieldKey]: value
      };

      // Check which section this field belongs to
      const sectionKey = Object.keys(CONTENT_SECTIONS).find(key =>
        CONTENT_SECTIONS[key].fields.some(f => f.key === fieldKey)
      );

      if (sectionKey) {
        checkSectionChanges(sectionKey, updated);
      }

      return updated;
    });
  };

  const handleSaveSection = async (sectionKey) => {
    const section = CONTENT_SECTIONS[sectionKey];

    // Show confirmation dialog
    const confirmed = confirm(`Are you sure you want to save changes to ${section.title}?\n\nThis will update the content on the public website for the ${selectedRegion} region.`);

    if (!confirmed) {
      return;
    }

    setSavingSection(sectionKey);

    try {
      // Save each field in the section
      const savePromises = section.fields.map(field => {
        const value = content[field.key] || '';
        // Try to update first, if it fails, create
        return api.updatePageContent(field.key, value, selectedRegion)
          .catch(() => api.createPageContent(field.key, value, selectedRegion));
      });

      await Promise.all(savePromises);

      showToast(`${section.title} saved successfully!`, 'success');
      await fetchContent(); // Refresh to get server data and reset hasUnsavedChanges
    } catch (err) {
      setError(`Failed to save ${section.title}`);
      showToast(err.message || `Failed to save ${section.title}`, 'error');
      console.error(err);
    } finally {
      setSavingSection(null);
    }
  };

  if (loading) {
    return (
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Page Content</h2>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading content...</p>
          </div>
        </div>
      </section>
    );
  }

  const currentSection = CONTENT_SECTIONS[activeSection];
  const FlagIcon = FlagIcons[selectedRegion];

  return (
    <section className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-bold text-gray-900">Page Content</h2>
          {FlagIcon && <FlagIcon className="w-6 h-4" title={selectedRegion} />}
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Edit text content for all website sections
        </p>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Sub-Tabs Navigation */}
      <div className="border-b border-gray-200 bg-gray-50">
        <nav className="flex px-6">
          {Object.entries(CONTENT_SECTIONS).map(([sectionKey, section]) => (
            <button
              key={sectionKey}
              onClick={() => setActiveSection(sectionKey)}
              className={`py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
                activeSection === sectionKey
                  ? 'border-blue-500 text-blue-600 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {section.title}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {currentSection.title}
          </h3>
          <p className="text-sm text-gray-500">
            {currentSection.description}
          </p>
        </div>

        <div className="space-y-6">
          {currentSection.fields.map(field => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
              </label>
              <RichTextEditor
                value={content[field.key] || ''}
                onChange={(value) => handleFieldChange(field.key, value)}
                placeholder={field.placeholder}
              />
            </div>
          ))}
        </div>

        {/* Save Button - Only show if there are unsaved changes */}
        {hasUnsavedChanges[activeSection] && (
          <div className="flex justify-end pt-6 mt-6 border-t border-gray-200">
            <button
              onClick={() => handleSaveSection(activeSection)}
              disabled={savingSection === activeSection}
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingSection === activeSection ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
