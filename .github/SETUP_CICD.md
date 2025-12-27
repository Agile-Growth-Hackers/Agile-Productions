# CI/CD Setup Instructions

This repository uses GitHub Actions for automated testing and deployment.

## Required GitHub Secrets

To enable CI/CD, add the following secrets to your GitHub repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add the following secrets:

### Cloudflare Secrets

- **CLOUDFLARE_API_TOKEN**
  - Get from: Cloudflare Dashboard → My Profile → API Tokens
  - Required permissions: Workers Scripts:Edit, Pages:Edit, Account Settings:Read
  - Create token: https://dash.cloudflare.com/profile/api-tokens

- **CLOUDFLARE_ACCOUNT_ID**
  - Get from: Cloudflare Dashboard → Workers & Pages → Overview
  - Look for "Account ID" in the right sidebar

### Frontend Environment Variables

- **VITE_API_URL**
  - Value: `https://agile-productions-api.cool-bonus-e67f.workers.dev`
  - Used during frontend build

## Workflow Triggers

### Backend CI/CD (`backend-ci.yml`)
- **Triggers on:**
  - Push to `main` or `develop` branches (workers/ directory changes)
  - Pull requests to `main` (workers/ directory changes)
- **Actions:**
  - Runs tests with Vitest
  - Deploys to Cloudflare Workers (main branch only)

### Frontend CI/CD (`frontend-ci.yml`)
- **Triggers on:**
  - Push to `main` or `develop` branches (frontend/ directory changes)
  - Pull requests to `main` (frontend/ directory changes)
- **Actions:**
  - Runs linter
  - Builds frontend
  - Deploys to Cloudflare Pages (main branch only)

## Manual Deployment

If you need to deploy manually:

```bash
# Backend
cd workers
npx wrangler deploy

# Frontend
cd frontend
npm run build
npx wrangler pages deploy dist --project-name=agile-productions
```

## Testing Locally

```bash
# Backend tests
cd workers
npm install
npm test

# Frontend build test
cd frontend
npm install
npm run build
```

## Deployment Protection

- Only `main` branch pushes trigger production deployments
- Pull requests trigger tests only (no deployment)
- Failed tests prevent deployment

## Notifications

GitHub will show deployment status:
- ✅ Green check = successful deployment
- ❌ Red X = failed deployment
- Click on the status for detailed logs
