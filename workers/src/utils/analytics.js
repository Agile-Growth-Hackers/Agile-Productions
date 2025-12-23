/**
 * Cloudflare Analytics API integration
 * Fetches real usage data from Cloudflare's GraphQL Analytics API
 */

/**
 * Fetch Workers Analytics data
 * @param {string} accountId - Cloudflare account ID
 * @param {string} apiToken - Cloudflare API token with Analytics:Read permission
 * @param {string} scriptName - Worker script name
 * @param {Date} startDate - Start date for analytics query
 * @param {Date} endDate - End date for analytics query
 */
export async function getWorkersAnalytics(accountId, apiToken, scriptName, startDate, endDate) {
  const query = `
    query WorkersAnalytics($accountId: String!, $startDate: Time!, $endDate: Time!, $scriptName: String!) {
      viewer {
        accounts(filter: {accountTag: $accountId}) {
          workersInvocationsAdaptive(
            filter: {
              datetime_geq: $startDate
              datetime_leq: $endDate
              scriptName: $scriptName
            }
            limit: 10000
          ) {
            sum {
              requests
              errors
              subrequests
            }
            dimensions {
              date
            }
          }
        }
      }
    }
  `;

  const variables = {
    accountId,
    scriptName,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };

  try {
    const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Analytics API error:', error);
      throw new Error(`Analytics API failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      throw new Error('GraphQL query failed');
    }

    const analytics = data.data?.viewer?.accounts[0]?.workersInvocationsAdaptive || [];

    // Sum up all requests
    const totalRequests = analytics.reduce((sum, item) => sum + (item.sum?.requests || 0), 0);
    const totalErrors = analytics.reduce((sum, item) => sum + (item.sum?.errors || 0), 0);

    return {
      requests: totalRequests,
      errors: totalErrors,
      success: true,
    };
  } catch (error) {
    console.error('Failed to fetch Workers analytics:', error);
    return {
      requests: 0,
      errors: 0,
      success: false,
      error: error.message,
    };
  }
}

/**
 * Fetch R2 Analytics data
 * Note: R2 analytics are limited - only storage metrics available via API
 */
export async function getR2Analytics(accountId, apiToken, bucketName) {
  // R2 doesn't provide detailed operation analytics via API
  // We can only get storage metrics which we already get from bucket.list()
  // Class A/B operations would need to be tracked manually

  return {
    success: false,
    message: 'R2 operation metrics not available via Analytics API',
  };
}

/**
 * Get current month date range
 */
export function getCurrentMonthRange() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  return {
    start: startOfMonth,
    end: endOfMonth,
  };
}

/**
 * Get today's date range
 */
export function getTodayRange() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  return {
    start: startOfDay,
    end: endOfDay,
  };
}
