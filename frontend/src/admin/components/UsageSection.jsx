import { useState, useEffect } from 'react';
import api from '../../services/api';

function MetricCard({ title, value, limit, unit, icon, description }) {
  const percentage = limit ? (value / limit) * 100 : 0;
  const getColor = () => {
    if (percentage >= 80) return 'red';
    if (percentage >= 50) return 'yellow';
    return 'green';
  };

  const color = getColor();
  const colorClasses = {
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      bar: 'bg-green-500'
    },
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      bar: 'bg-yellow-500'
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      bar: 'bg-red-500'
    }
  };

  return (
    <div className={`rounded-lg border-2 p-6 ${colorClasses[color].bg} ${colorClasses[color].border}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color].bg}`}>
          {icon}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <span className={`text-3xl font-bold ${colorClasses[color].text}`}>
            {value.toLocaleString()}
          </span>
          <span className="text-sm text-gray-600">{unit}</span>
        </div>

        {limit && (
          <>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all ${colorClasses[color].bar}`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {limit.toLocaleString()} {unit} limit
              </span>
              <span className={`font-medium ${colorClasses[color].text}`}>
                {percentage.toFixed(1)}% used
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function UsageSection() {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchUsage();
    // Refresh every 5 minutes
    const interval = setInterval(fetchUsage, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchUsage = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getUsageStats();
      setUsage(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to load usage metrics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !usage) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading usage metrics...</p>
        </div>
      </div>
    );
  }

  if (error && !usage) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cloudflare Resource Usage</h2>
          <p className="text-sm text-gray-500 mt-1">
            Monitor your free tier limits to avoid unexpected charges
          </p>
        </div>
        <button
          onClick={fetchUsage}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
        >
          <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {lastUpdated && (
        <p className="text-xs text-gray-500">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      )}

      {error && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">{error}</p>
        </div>
      )}

      {/* Metrics Grid */}
      {usage && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* R2 Storage */}
          <MetricCard
            title="R2 Storage"
            value={usage.r2?.storage_gb || 0}
            limit={10}
            unit="GB"
            description="Total storage used in R2 bucket"
            icon={
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            }
          />

          {/* R2 Class A Operations */}
          <MetricCard
            title="R2 Class A Operations"
            value={usage.r2?.class_a_operations || 0}
            limit={1000000}
            unit="ops/month"
            description="Writes, lists, and other mutating operations"
            icon={
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            }
          />

          {/* R2 Class B Operations */}
          <MetricCard
            title="R2 Class B Operations"
            value={usage.r2?.class_b_operations || 0}
            limit={10000000}
            unit="ops/month"
            description="Reads and other non-mutating operations"
            icon={
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
            }
          />

          {/* Workers Requests */}
          <MetricCard
            title="Workers Requests"
            value={usage.workers?.requests || 0}
            limit={100000}
            unit="req/day"
            description="Total API requests this month"
            icon={
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          />

          {/* D1 Database Rows */}
          <MetricCard
            title="D1 Database Rows"
            value={usage.d1?.total_rows || 0}
            limit={5000000}
            unit="rows"
            description="Total rows across all tables"
            icon={
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            }
          />

          {/* D1 Database Size */}
          <MetricCard
            title="D1 Database Size"
            value={usage.d1?.size_mb || 0}
            limit={null}
            unit="MB"
            description="Total database storage"
            icon={
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            }
          />

          {/* Bandwidth */}
          <MetricCard
            title="Bandwidth"
            value={usage.bandwidth?.egress_gb || 0}
            limit={null}
            unit="GB"
            description="Data transferred this month"
            icon={
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            }
          />

          {/* File Counts by Category */}
          <MetricCard
            title="Total Files"
            value={usage.files?.total || 0}
            limit={null}
            unit="files"
            description={`Slider: ${usage.files?.slider || 0} | Gallery: ${usage.files?.gallery || 0} | Logos: ${usage.files?.logos || 0}`}
            icon={
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
        </div>
      )}

      {/* Free Tier Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Cloudflare Free Tier Limits</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• R2 Storage: 10 GB</li>
          <li>• R2 Class A Operations: 1 million/month</li>
          <li>• R2 Class B Operations: 10 million/month</li>
          <li>• Workers Requests: 100,000/day</li>
          <li>• D1 Database: 5 million rows</li>
          <li>• Bandwidth: Included with Workers</li>
        </ul>
      </div>
    </div>
  );
}
