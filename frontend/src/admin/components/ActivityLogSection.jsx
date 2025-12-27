import { useState, useEffect } from 'react';
import api from '../../services/api';
import ActivityLogDetailModal from './ActivityLogDetailModal';

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

const ACTION_TYPE_COLORS = {
  login_success: 'bg-green-100 text-green-800',
  login_failed: 'bg-red-100 text-red-800',
  logout: 'bg-gray-100 text-gray-800',
  content_create: 'bg-blue-100 text-blue-800',
  content_update: 'bg-yellow-100 text-yellow-800',
  content_delete: 'bg-red-100 text-red-800',
  content_reorder: 'bg-purple-100 text-purple-800',
  user_create: 'bg-blue-100 text-blue-800',
  user_update: 'bg-yellow-100 text-yellow-800',
  user_delete: 'bg-red-100 text-red-800',
  image_upload: 'bg-blue-100 text-blue-800',
  image_delete: 'bg-red-100 text-red-800',
};

export default function ActivityLogSection() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filters
  const [actionTypeFilter, setActionTypeFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, yesterday, 24h, 3days, week, custom
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const limit = 50;

  useEffect(() => {
    fetchLogs();
  }, [actionTypeFilter, entityTypeFilter, dateFilter, customStartDate, customEndDate, currentPage]);

  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (dateFilter) {
      case 'today':
        return {
          start_date: today.toISOString(),
          end_date: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
        };
      case 'yesterday':
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        return {
          start_date: yesterday.toISOString(),
          end_date: today.toISOString()
        };
      case '24h':
        return {
          start_date: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
          end_date: now.toISOString()
        };
      case '3days':
        return {
          start_date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          end_date: now.toISOString()
        };
      case 'week':
        return {
          start_date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          end_date: now.toISOString()
        };
      case 'custom':
        if (customStartDate && customEndDate) {
          return {
            start_date: new Date(customStartDate).toISOString(),
            end_date: new Date(customEndDate + 'T23:59:59').toISOString()
          };
        }
        return {};
      default:
        return {};
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        limit,
        offset: (currentPage - 1) * limit,
      };

      if (actionTypeFilter) params.action_type = actionTypeFilter;
      if (entityTypeFilter) params.entity_type = entityTypeFilter;

      const dateRange = getDateRange();
      if (dateRange.start_date) params.start_date = dateRange.start_date;
      if (dateRange.end_date) params.end_date = dateRange.end_date;

      const response = await api.getActivityLogs(params);

      // Backend returns { logs: [], pagination: {} }
      setLogs(response.logs || []);
      setHasMore(response.pagination?.hasMore || false);
    } catch (err) {
      setError(err.message);
      setLogs([]);
      console.error('Failed to fetch activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = async (log) => {
    // If the log doesn't have full details, fetch them
    if (!log.oldValues && !log.newValues) {
      try {
        const fullLog = await api.getActivityLog(log.id);
        setSelectedLog(fullLog);
      } catch (err) {
        console.error('Failed to fetch log details:', err);
        setSelectedLog(log);
      }
    } else {
      setSelectedLog(log);
    }
    setShowDetailModal(true);
  };

  const handleFilterChange = () => {
    setCurrentPage(1); // Reset to first page when filters change
  };

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

  const getActionBadge = (actionType) => {
    const label = ACTION_TYPE_LABELS[actionType] || actionType;
    const color = ACTION_TYPE_COLORS[actionType] || 'bg-gray-100 text-gray-800';
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
        {label}
      </span>
    );
  };

  if (loading && logs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Activity Log</h2>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label htmlFor="actionType" className="block text-sm font-medium text-gray-700 mb-1">
              Action Type
            </label>
            <select
              id="actionType"
              value={actionTypeFilter}
              onChange={(e) => {
                setActionTypeFilter(e.target.value);
                handleFilterChange();
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Actions</option>
              <option value="login_success">Login Success</option>
              <option value="login_failed">Login Failed</option>
              <option value="logout">Logout</option>
              <option value="content_create">Content Created</option>
              <option value="content_update">Content Updated</option>
              <option value="content_delete">Content Deleted</option>
              <option value="content_reorder">Content Reordered</option>
              <option value="user_create">User Created</option>
              <option value="user_update">User Updated</option>
              <option value="user_delete">User Deleted</option>
              <option value="image_upload">Image Upload</option>
              <option value="image_delete">Image Delete</option>
            </select>
          </div>

          <div>
            <label htmlFor="entityType" className="block text-sm font-medium text-gray-700 mb-1">
              Entity Type
            </label>
            <select
              id="entityType"
              value={entityTypeFilter}
              onChange={(e) => {
                setEntityTypeFilter(e.target.value);
                handleFilterChange();
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Entities</option>
              <option value="admin">Admin Users</option>
              <option value="slider_image">Slider Images</option>
              <option value="gallery_image">Gallery Images</option>
              <option value="client_logo">Client Logos</option>
              <option value="image_storage">Image Storage</option>
              <option value="auth">Authentication</option>
            </select>
          </div>

          <div>
            <label htmlFor="dateFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Time Period
            </label>
            <select
              id="dateFilter"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                handleFilterChange();
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="24h">Last 24 Hours</option>
              <option value="3days">Last 3 Days</option>
              <option value="week">Last 7 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range */}
        {dateFilter === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={customStartDate}
                onChange={(e) => {
                  setCustomStartDate(e.target.value);
                  handleFilterChange();
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={customEndDate}
                onChange={(e) => {
                  setCustomEndDate(e.target.value);
                  handleFilterChange();
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date/Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                IP Address
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  No activity logs found
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => handleRowClick(log)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(log.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {log.full_name || log.username}
                    </div>
                    {log.full_name && (
                      <div className="text-sm text-gray-500">@{log.username}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getActionBadge(log.action_type)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {log.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.ip_address || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {logs.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page {currentPage}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={!hasMore || loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {showDetailModal && selectedLog && (
        <ActivityLogDetailModal
          log={selectedLog}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedLog(null);
          }}
        />
      )}
    </div>
  );
}
