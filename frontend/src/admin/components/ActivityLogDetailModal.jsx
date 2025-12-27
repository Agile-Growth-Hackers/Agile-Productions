import { useState } from 'react';

const ACTION_TYPE_LABELS = {
  login_success: 'Login Success',
  login_failed: 'Login Failed',
  logout: 'Logout',
  content_create: 'Content Created',
  content_update: 'Content Updated',
  content_delete: 'Content Deleted',
  content_reorder: 'Content Reordered',
  user_create: 'User Created',
  user_update: 'User Updated',
  user_delete: 'User Deleted',
  image_upload: 'Image Upload',
  image_delete: 'Image Delete',
};

const ENTITY_TYPE_LABELS = {
  admin: 'Admin User',
  slider_image: 'Slider Image',
  gallery_image: 'Gallery Image',
  client_logo: 'Client Logo',
  image_storage: 'Image Storage',
  auth: 'Authentication',
};

export default function ActivityLogDetailModal({ log, onClose }) {
  const [activeTab, setActiveTab] = useState('after'); // 'before' or 'after' for reorder operations

  const formatDate = (dateString) => {
    // SQLite returns UTC timestamps without 'Z', so we need to append it
    const utcDate = dateString.includes('Z') ? dateString : dateString + 'Z';
    const date = new Date(utcDate);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const renderValue = (value) => {
    if (value === null || value === undefined) return <span className="text-gray-400">null</span>;
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const renderReorderComparison = () => {
    // Parse if strings
    const oldValues = typeof log.oldValues === 'string'
      ? JSON.parse(log.oldValues)
      : log.oldValues || {};
    const newValues = typeof log.newValues === 'string'
      ? JSON.parse(log.newValues)
      : log.newValues || {};

    const oldOrder = oldValues.order || [];
    const newOrder = newValues.order || [];

    if (oldOrder.length === 0 && newOrder.length === 0) return null;

    return (
      <div className="mt-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Reorder Details</h4>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-4">
          <nav className="flex space-x-4">
            <button
              onClick={() => setActiveTab('before')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'before'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Before
            </button>
            <button
              onClick={() => setActiveTab('after')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'after'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              After
            </button>
          </nav>
        </div>

        {/* Order List */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <ol className="space-y-2">
            {(activeTab === 'before' ? oldOrder : newOrder).map((item, index) => (
              <li key={item.id} className="flex items-center text-sm">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-semibold mr-3 text-xs">
                  {index + 1}
                </span>
                <span className="text-gray-900">
                  {item.name || item.filename || item.alt_text || `ID: ${item.id}`}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    );
  };

  const renderComparison = () => {
    if (!log.oldValues && !log.newValues) return null;

    // Check if this is a reorder operation
    if (log.action_type === 'content_reorder') {
      return renderReorderComparison();
    }

    // Parse if strings
    const oldValues = typeof log.oldValues === 'string'
      ? JSON.parse(log.oldValues)
      : log.oldValues || {};
    const newValues = typeof log.newValues === 'string'
      ? JSON.parse(log.newValues)
      : log.newValues || {};

    // Get all unique keys from both objects
    const allKeys = new Set([
      ...Object.keys(oldValues),
      ...Object.keys(newValues),
    ]);

    if (allKeys.size === 0) return null;

    return (
      <div className="mt-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Changes</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Field
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Before
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  After
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.from(allKeys).map((key) => {
                const oldValue = oldValues[key];
                const newValue = newValues[key];
                const hasChanged = JSON.stringify(oldValue) !== JSON.stringify(newValue);

                return (
                  <tr key={key} className={hasChanged ? 'bg-yellow-50' : ''}>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">
                      {key}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700 font-mono break-all">
                      {renderValue(oldValue)}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700 font-mono break-all">
                      {renderValue(newValue)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-gray-900">Activity Log Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* Action Information */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Action Information</h4>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">Action Type</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {ACTION_TYPE_LABELS[log.action_type] || log.action_type}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">Entity Type</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {log.entity_type
                    ? ENTITY_TYPE_LABELS[log.entity_type] || log.entity_type
                    : '-'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">Entity ID</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {log.entity_id || '-'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">Date/Time</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDate(log.created_at)}
                </dd>
              </div>
            </dl>
          </div>

          {/* User Information */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">User Information</h4>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">Full Name</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {log.full_name || '-'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">Username</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {log.username}
                </dd>
              </div>
            </dl>
          </div>

          {/* Request Information */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Request Information</h4>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">IP Address</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">
                  {log.ip_address || '-'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">User Agent</dt>
                <dd className="mt-1 text-sm text-gray-900 break-all">
                  {log.user_agent || '-'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Description</h4>
            <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
              {log.description}
            </p>
          </div>

          {/* Before/After Comparison */}
          {renderComparison()}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
