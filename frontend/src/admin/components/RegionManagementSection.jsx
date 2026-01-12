import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

// Comprehensive list of countries with ISO codes
const COUNTRIES = [
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'AU', name: 'Australia' },
  { code: 'BR', name: 'Brazil' },
  { code: 'CA', name: 'Canada' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'CN', name: 'China' },
  { code: 'DE', name: 'Germany' },
  { code: 'ES', name: 'Spain' },
  { code: 'FR', name: 'France' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'IN', name: 'India' },
  { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'MX', name: 'Mexico' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'RU', name: 'Russia' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'SE', name: 'Sweden' },
  { code: 'SG', name: 'Singapore' },
  { code: 'TH', name: 'Thailand' },
  { code: 'US', name: 'United States' },
  { code: 'ZA', name: 'South Africa' },
].sort((a, b) => a.name.localeCompare(b.name));

export default function RegionManagementSection() {
  const { showToast } = useToast();
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRegion, setNewRegion] = useState({
    code: '',
    name: '',
    domain: '',
    route: '',
    copyFromRegion: ''
  });

  const fetchRegions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getAllRegions();
      console.log('Regions data:', data);
      setRegions(data || []);
    } catch (err) {
      console.error('Error fetching regions:', err);
      showToast('Failed to load regions', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchRegions();
  }, [fetchRegions]);

  const handleAddRegion = async (e) => {
    e.preventDefault();

    // Validate region code (2 uppercase letters)
    if (!/^[A-Z]{2}$/.test(newRegion.code)) {
      showToast('Region code must be 2 uppercase letters (e.g., US, AE)', 'error');
      return;
    }

    // Ensure at least domain or route is provided
    if (!newRegion.domain && !newRegion.route) {
      showToast('Please provide either a domain or a route', 'error');
      return;
    }

    try {
      await api.createRegion(newRegion);
      showToast(`Region ${newRegion.code} created successfully!`, 'success');
      setShowAddModal(false);
      setNewRegion({ code: '', name: '', domain: '', route: '', copyFromRegion: '' });
      await fetchRegions();
    } catch (err) {
      console.error('Error creating region:', err);
      showToast(err.message || 'Failed to create region', 'error');
    }
  };

  const handleToggleStatus = async (code, currentStatus) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    const action = newStatus === 1 ? 'activate' : 'deactivate';

    if (!confirm(`Are you sure you want to ${action} region ${code}?`)) {
      return;
    }

    try {
      await api.toggleRegionStatus(code, newStatus);
      showToast(`Region ${code} ${action}d successfully!`, 'success');
      await fetchRegions();
    } catch (err) {
      console.error('Error toggling region status:', err);
      showToast(err.message || 'Failed to update region status', 'error');
    }
  };

  const handleDeleteRegion = async (code) => {
    if (!confirm(`Are you sure you want to delete region ${code}? This will mark all content for this region as inactive.`)) {
      return;
    }

    try {
      await api.deleteRegion(code);
      showToast(`Region ${code} deleted successfully!`, 'success');
      await fetchRegions();
    } catch (err) {
      console.error('Error deleting region:', err);
      showToast(err.message || 'Failed to delete region', 'error');
    }
  };

  if (loading) {
    return (
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Region Management</h2>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading regions...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Region Management</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage website regions and their content
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add New Region</span>
        </button>
      </div>

      {/* Regions Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Code
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Domain
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Route
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {regions.map((region) => (
              <tr key={region.code} className={region.is_active === 0 ? 'opacity-60' : ''}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {region.code}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {region.name}
                  {region.is_default === 1 && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                      Default
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {region.domain || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {region.route || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-3">
                    {/* Toggle Switch */}
                    <button
                      onClick={() => handleToggleStatus(region.code, region.is_active)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        region.is_active === 1
                          ? 'bg-green-600 focus:ring-green-500'
                          : 'bg-red-600 focus:ring-red-500'
                      }`}
                      title={region.is_active === 1 ? 'Click to deactivate' : 'Click to activate'}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          region.is_active === 1 ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    {/* Status Badge */}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      region.is_active === 1
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {region.is_active === 1 ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleDeleteRegion(region.code)}
                    className="text-red-600 hover:text-red-900 disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={region.is_default === 1}
                    title={region.is_default === 1 ? 'Cannot delete the default region' : 'Delete region'}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Region Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Add New Region</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleAddRegion} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={newRegion.code}
                    onChange={(e) => {
                      const selectedCountry = COUNTRIES.find(c => c.code === e.target.value);
                      setNewRegion({
                        ...newRegion,
                        code: e.target.value,
                        name: selectedCountry?.name || ''
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a country...</option>
                    {COUNTRIES.filter(country => !regions.some(r => r.code === country.code)).map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.code} - {country.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">Country code and name will be auto-filled</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Region Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Auto-filled from country selection"
                    value={newRegion.name}
                    onChange={(e) => setNewRegion({ ...newRegion, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Auto-filled from country selection (editable)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Domain (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="example.us"
                    value={newRegion.domain}
                    onChange={(e) => setNewRegion({ ...newRegion, domain: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Leave empty for route-based regions</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Route (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="/en-us"
                    value={newRegion.route}
                    onChange={(e) => setNewRegion({ ...newRegion, route: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">For single-domain multi-region sites</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Copy Content From
                  </label>
                  <select
                    value={newRegion.copyFromRegion}
                    onChange={(e) => setNewRegion({ ...newRegion, copyFromRegion: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">None (start fresh)</option>
                    {regions.map((region) => (
                      <option key={region.code} value={region.code}>
                        {region.name} ({region.code})
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Duplicates all content: page text, services, team, slider, gallery, and logos
                  </p>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Region
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
