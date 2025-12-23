import { useState, useEffect } from 'react';
import api from '../../services/api';

function MetricCard({ title, value, limit, unit, icon, description }) {
  const percentage = limit ? (value / limit) * 100 : 0;
  const getColor = () => {
    if (percentage >= 90) return 'red';
    if (percentage >= 70) return 'yellow';
    return 'green';
  };

  const color = getColor();
  const showWarning = percentage >= 70;

  const colorClasses = {
    green: {
      bg: 'bg-gradient-to-br from-green-50 to-green-100',
      border: 'border-green-300',
      text: 'text-green-900',
      bar: 'bg-gradient-to-r from-green-500 to-green-600',
      icon: 'text-green-600'
    },
    yellow: {
      bg: 'bg-gradient-to-br from-yellow-50 to-yellow-100',
      border: 'border-yellow-300',
      text: 'text-yellow-900',
      bar: 'bg-gradient-to-r from-yellow-500 to-orange-500',
      icon: 'text-yellow-600'
    },
    red: {
      bg: 'bg-gradient-to-br from-red-50 to-red-100',
      border: 'border-red-300',
      text: 'text-red-900',
      bar: 'bg-gradient-to-r from-red-500 to-red-600',
      icon: 'text-red-600'
    }
  };

  return (
    <div className={`rounded-xl border-2 p-6 shadow-sm hover:shadow-md transition-shadow ${colorClasses[color].bg} ${colorClasses[color].border} relative overflow-hidden`}>
      {/* Warning badge */}
      {showWarning && (
        <div className="absolute top-3 right-3">
          <div className={`p-1.5 rounded-full ${color === 'red' ? 'bg-red-500' : 'bg-yellow-500'} animate-pulse`}>
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 pr-2">
          <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
          <p className="text-xs text-gray-600 leading-tight">{description}</p>
        </div>
        <div className={`p-3 rounded-lg bg-white/80 shadow-sm ${colorClasses[color].icon}`}>
          {icon}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <span className={`text-4xl font-extrabold ${colorClasses[color].text}`}>
            {value.toLocaleString()}
          </span>
          <span className="text-sm font-semibold text-gray-700 bg-white/60 px-2 py-1 rounded">{unit}</span>
        </div>

        {limit && (
          <>
            <div className="w-full bg-gray-300 rounded-full h-3 shadow-inner">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${colorClasses[color].bar} shadow-sm`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700 font-medium">
                Limit: {limit.toLocaleString()} {unit}
              </span>
              <span className={`font-bold ${colorClasses[color].text} text-base`}>
                {percentage.toFixed(1)}%
              </span>
            </div>
          </>
        )}

        {!limit && value > 0 && (
          <p className="text-xs text-green-600 font-medium mt-2 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Unlimited - No charges
          </p>
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
      console.log('Usage data received:', data);
      setUsage(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to load usage metrics: ' + err.message);
      console.error('Usage fetch error:', err);
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

  // Calculate critical alerts
  const getCriticalAlerts = () => {
    if (!usage) return [];
    const alerts = [];

    const checkLimit = (name, value, limit, unit) => {
      if (!limit) return;
      const percentage = (value / limit) * 100;
      if (percentage >= 90) {
        alerts.push({ name, percentage: percentage.toFixed(1), severity: 'critical', value, limit, unit });
      } else if (percentage >= 70) {
        alerts.push({ name, percentage: percentage.toFixed(1), severity: 'warning', value, limit, unit });
      }
    };

    checkLimit('R2 Storage', usage.r2?.storage_gb || 0, 10, 'GB');
    checkLimit('R2 Class A Operations', usage.r2?.class_a_operations || 0, 1000000, 'ops');
    checkLimit('R2 Class B Operations', usage.r2?.class_b_operations || 0, 10000000, 'ops');
    checkLimit('Workers Requests', usage.workers?.requests || 0, 100000, 'req/day');
    checkLimit('D1 Database Rows', usage.d1?.total_rows || 0, 5000000, 'rows');

    return alerts;
  };

  const criticalAlerts = getCriticalAlerts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Cloudflare Resource Usage</h2>
            <p className="text-blue-100">
              Monitor your free tier limits to avoid unexpected charges
            </p>
          </div>
          <button
            onClick={fetchUsage}
            disabled={loading}
            className="px-5 py-2.5 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-all disabled:opacity-50 flex items-center space-x-2 shadow-md"
          >
            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>
        {lastUpdated && (
          <p className="text-xs text-blue-200 mt-3">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Critical Alerts Banner */}
      {criticalAlerts.length > 0 && (
        <div className={`rounded-xl border-2 p-5 ${criticalAlerts.some(a => a.severity === 'critical') ? 'bg-red-50 border-red-300' : 'bg-yellow-50 border-yellow-300'}`}>
          <div className="flex items-start space-x-3">
            <div className={`p-2 rounded-full ${criticalAlerts.some(a => a.severity === 'critical') ? 'bg-red-500' : 'bg-yellow-500'}`}>
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className={`font-bold text-lg mb-2 ${criticalAlerts.some(a => a.severity === 'critical') ? 'text-red-900' : 'text-yellow-900'}`}>
                {criticalAlerts.some(a => a.severity === 'critical') ? 'Critical: Resources Near Limit!' : 'Warning: High Resource Usage'}
              </h3>
              <ul className="space-y-1">
                {criticalAlerts.map((alert, idx) => (
                  <li key={idx} className={`text-sm ${alert.severity === 'critical' ? 'text-red-800' : 'text-yellow-800'} font-medium`}>
                    • <strong>{alert.name}</strong>: {alert.value.toLocaleString()} / {alert.limit.toLocaleString()} {alert.unit} ({alert.percentage}% used)
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
          <p className="text-sm text-red-800 font-medium">{error}</p>
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
            limit={5000}
            unit="MB"
            description="Total database storage (5 GB limit)"
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
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-6 shadow-sm">
        <h3 className="font-bold text-blue-900 mb-3 text-lg flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Cloudflare Free Tier Limits
        </h3>
        <div className="grid md:grid-cols-2 gap-x-8 gap-y-2">
          <ul className="text-sm text-blue-900 space-y-2">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              <span><strong>R2 Storage:</strong> 10 GB free/month</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              <span><strong>R2 Class A Ops:</strong> 1M free/month</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              <span><strong>R2 Class B Ops:</strong> 10M free/month</span>
            </li>
          </ul>
          <ul className="text-sm text-blue-900 space-y-2">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              <span><strong>Workers Requests:</strong> 100K free/day</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              <span><strong>D1 Database:</strong> 5M rows, 5 GB free</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">★</span>
              <span><strong>R2 Bandwidth:</strong> Unlimited - Always free!</span>
            </li>
          </ul>
        </div>
        <div className="mt-4 p-3 bg-blue-100/50 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Note:</strong> R2 bandwidth is completely free with no limits. Storage usage is updated in real-time. Operation counters reset monthly.
          </p>
        </div>
      </div>
    </div>
  );
}
