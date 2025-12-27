# Uptime Monitoring Setup

Monitor your website's availability and get instant alerts when issues occur.

## Why Uptime Monitoring?

- Get notified immediately when your site goes down
- Track uptime percentage and performance metrics
- Monitor API health checks
- Identify patterns in downtime
- Free tier available with most providers

## Recommended Solution: UptimeRobot (Free)

UptimeRobot offers a generous free tier perfect for this use case:
- ✅ 50 monitors (you'll use 3-4)
- ✅ 5-minute check intervals
- ✅ Email/SMS/Slack alerts
- ✅ Status page
- ✅ 90-day statistics retention

## Setup Instructions (15 minutes)

### 1. Create UptimeRobot Account

1. Go to https://uptimerobot.com
2. Click **Sign Up** (free)
3. Verify your email address
4. Log in to dashboard

### 2. Add Monitors

Create these monitors for comprehensive coverage:

#### Monitor 1: Frontend (Website)
- **Monitor Type:** HTTP(s)
- **Friendly Name:** Agile Productions - Frontend
- **URL:** `https://agile-productions.pages.dev` (or your custom domain)
- **Monitoring Interval:** 5 minutes
- **Monitor Timeout:** 30 seconds
- **Advanced Settings:**
  - HTTP Status Code: `200`
  - Keyword: (leave empty or use "Agile Productions" if it appears in HTML)

#### Monitor 2: Backend API Health Check
- **Monitor Type:** HTTP(s)
- **Friendly Name:** Agile Productions - API Health
- **URL:** `https://api.agile-productions.workers.dev/health` (your API domain)
- **Monitoring Interval:** 5 minutes
- **Monitor Timeout:** 30 seconds
- **Advanced Settings:**
  - HTTP Status Code: `200`
  - Keyword: `"status":"healthy"` (checks for this in JSON response)

#### Monitor 3: Backend Root
- **Monitor Type:** HTTP(s)
- **Friendly Name:** Agile Productions - API Root
- **URL:** `https://api.agile-productions.workers.dev/` (your API domain)
- **Monitoring Interval:** 5 minutes
- **Monitor Timeout:** 30 seconds
- **Advanced Settings:**
  - HTTP Status Code: `200`
  - Keyword: `"status":"ok"`

#### Monitor 4: Database Connectivity (via API)
- **Monitor Type:** HTTP(s)
- **Friendly Name:** Agile Productions - Database
- **URL:** `https://api.agile-productions.workers.dev/api/slider`
- **Monitoring Interval:** 5 minutes
- **Monitor Timeout:** 30 seconds
- **Advanced Settings:**
  - HTTP Status Code: `200`

### 3. Configure Alert Contacts

1. Go to **My Settings** > **Alert Contacts**
2. Add your email (should already be there)
3. **Optional:** Add additional contacts:
   - **Slack:** Integrate with your Slack workspace
   - **Discord:** Get alerts in Discord
   - **Telegram:** Mobile notifications
   - **SMS:** For critical alerts (paid feature)

### 4. Set Up Alert Rules

For each monitor:
1. Click the monitor name
2. Go to **Alert Contacts**
3. Enable your contact methods
4. Configure alert threshold:
   - Send alert when down for: `1 check` (5 minutes)
   - Remind every: `30 minutes` (until fixed)

### 5. Create Status Page (Optional but Recommended)

1. Go to **Status Pages** > **Add Status Page**
2. Configure:
   - **Type:** Public Status Page
   - **Friendly Name:** Agile Productions Status
   - **Custom URL:** `agile-productions` → https://stats.uptimerobot.com/agile-productions
   - **Select Monitors:** Choose all 4 monitors
   - **Options:**
     - ✅ Show uptime percentages
     - ✅ Show response times
     - ✅ Allow subscribing for notifications
3. Click **Create Status Page**
4. Share the URL with your team or users

## Alternative Solution: Cloudflare Health Checks (Paid)

If you're using Cloudflare for DNS/CDN, they offer built-in health checks:

### Setup with Cloudflare:

1. Go to Cloudflare Dashboard
2. Navigate to **Traffic** > **Health Checks**
3. Click **Create Health Check**
4. Configure similar to UptimeRobot monitors above
5. Set up notifications in **Notifications** section

**Note:** Cloudflare Health Checks are only available on paid plans ($20+/month)

## Verify Your Setup

### Test Downtime Detection:

1. Temporarily disable your Worker or cause an error
2. Wait 5 minutes
3. You should receive an alert
4. Fix the issue
5. Wait 5 minutes
6. You should receive a recovery notification

### Check Dashboard:

- Visit UptimeRobot dashboard
- Verify all monitors show "Up" status
- Check response times (should be <500ms typically)

## Interpreting Metrics

### Good Health Indicators:
- ✅ 99.9%+ uptime
- ✅ <500ms response time
- ✅ No alerts

### Warning Signs:
- ⚠️ <99.5% uptime
- ⚠️ >1000ms response time
- ⚠️ Frequent up/down flapping

### Action Required:
- 🚨 <99% uptime
- 🚨 Multiple services down
- 🚨 Database connectivity issues

## Maintenance Windows

When doing planned maintenance:

1. Go to **Maintenance Windows** in UptimeRobot
2. Click **Add Maintenance Window**
3. Set start and end time
4. Select affected monitors
5. Alerts will be paused during this period

## Integration with Sentry (Already Configured)

Your Sentry setup complements uptime monitoring:
- **UptimeRobot:** Detects when site is down
- **Sentry:** Captures errors when site is up but misbehaving

Together, they provide complete observability.

## Monitoring Checklist

Once set up, you'll have:
- ✅ 24/7 availability monitoring
- ✅ Instant downtime alerts
- ✅ API health tracking
- ✅ Database connectivity checks
- ✅ Public status page
- ✅ Historical uptime data
- ✅ Response time tracking

## Cost Summary

- **UptimeRobot Free:** $0/month (recommended)
  - 50 monitors, 5-min intervals, email alerts

- **UptimeRobot Pro:** $7/month (optional)
  - 1-min intervals, SMS alerts, more contacts

- **Cloudflare Health Checks:** $20+/month
  - Requires paid Cloudflare plan

**Recommendation:** Start with UptimeRobot free tier - it's perfect for your needs!

Your website will now have professional-grade uptime monitoring!
