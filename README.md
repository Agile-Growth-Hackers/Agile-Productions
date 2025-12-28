# Agile Productions

A modern, full-stack web application for managing and showcasing visual content. Built with React, Cloudflare Workers, and deployed on Cloudflare's edge network for optimal performance.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Development](#development)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Contributing](#contributing)

## Overview

Agile Productions is a professional platform designed to showcase visual content through customizable sliders, galleries, and client logos. The application features a comprehensive admin dashboard for content management, user administration, and activity tracking.

**Live Sites:**
- Production: https://agileproductions.in
- Alternative: https://agileproductions.ae

## Features

### Public Features
- **Hero Slider**: Dynamic image slider with customizable positioning and transitions
- **Gallery**: Responsive image gallery with desktop and mobile optimizations
- **Client Logos**: Showcase client partnerships with logo carousel
- **Progressive Web App**: Installable with offline support
- **Performance Optimized**: Lighthouse scores 90+ on all metrics

### Admin Features
- **Content Management**
  - Drag-and-drop slider reordering
  - Object position editor with presets and custom values
  - Gallery image management with mobile visibility controls
  - Client logo management with batch operations
  - Image storage library with reusable assets

- **User Management** (Super Admin)
  - Create, edit, and delete admin users
  - Role-based permissions (Admin vs Super Admin)
  - Protected test accounts for CI/CD

- **Activity Logs** (Super Admin)
  - Comprehensive audit trail of all actions
  - Filterable by user, action type, and date range
  - Automatic cleanup of old logs

- **Profile Management**
  - Update personal information
  - Change password
  - Profile picture upload

- **Security**
  - JWT-based authentication
  - CSRF protection
  - Password complexity validation
  - Secure session management

## Tech Stack

### Frontend
- **Framework**: React 19.2
- **Build Tool**: Vite 7.2
- **Styling**: Tailwind CSS 4.1
- **Router**: React Router 7.11
- **State Management**: React Context API
- **Drag & Drop**: react-dnd 16.0
- **Monitoring**: Sentry 10.32
- **Hosting**: Cloudflare Pages

### Backend
- **Runtime**: Cloudflare Workers
- **Framework**: Hono 4.11
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 (S3-compatible)
- **Authentication**: JWT (jose 6.1)
- **Image Compression**: TinyPNG API
- **Monitoring**: Sentry 10.32

### Development & Testing
- **E2E Testing**: Playwright 1.57
- **Unit Testing**: Vitest 2.1
- **Linting**: ESLint 9.39
- **CI/CD**: GitHub Actions

## Project Structure

```
agile-productions/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── admin/           # Admin dashboard components
│   │   │   ├── components/  # Reusable admin components
│   │   │   └── pages/       # Admin page components
│   │   ├── components/      # Public-facing components
│   │   ├── context/         # React context providers
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API service layer
│   │   └── App.jsx          # Main application component
│   ├── e2e/                 # Playwright E2E tests
│   ├── public/              # Static assets
│   └── package.json
│
├── workers/                  # Cloudflare Workers backend
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   │   ├── auth.js      # Authentication endpoints
│   │   │   ├── slider.js    # Slider management
│   │   │   ├── gallery.js   # Gallery management
│   │   │   ├── logos.js     # Logo management
│   │   │   ├── storage.js   # Image storage
│   │   │   ├── users.js     # User management
│   │   │   └── activity.js  # Activity logs
│   │   ├── middleware/      # Express-style middleware
│   │   ├── utils/           # Utility functions
│   │   └── index.js         # Worker entry point
│   ├── migrations/          # Database migration files
│   ├── scripts/             # Deployment & utility scripts
│   ├── tests/               # Unit tests
│   ├── wrangler.toml        # Cloudflare Workers config
│   └── package.json
│
├── .github/
│   └── workflows/           # CI/CD pipelines
│       ├── frontend-ci.yml  # Frontend build & test
│       ├── backend-ci.yml   # Backend test & deploy
│       └── database-backup.yml  # Daily DB backups
│
└── README.md                # This file
```

## Prerequisites

- **Node.js**: v18 or higher
- **npm**: v9 or higher
- **Cloudflare Account**: For deployment
- **Wrangler CLI**: `npm install -g wrangler`
- **TinyPNG API Key**: (Optional) For image compression

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Agile-Growth-Hackers/Agile-Productions.git
cd Agile-Productions
```

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 3. Install Backend Dependencies

```bash
cd ../workers
npm install
```

### 4. Configure Environment Variables

#### Frontend (.env)
Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:8787
```

#### Backend (Wrangler Secrets)
The backend uses Cloudflare secrets for sensitive data:

```bash
cd workers

# Set JWT secret
npx wrangler secret put JWT_SECRET

# Set TinyPNG API key (optional)
npx wrangler secret put TINYPNG_API_KEY

# Set Sentry DSN (optional)
npx wrangler secret put SENTRY_DSN
```

## Development

### Frontend Development

```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Backend Development

```bash
cd workers
npm run dev
```

The API will be available at `http://localhost:8787`

### Running Both Simultaneously

Open two terminal windows and run both commands above.

## Deployment

### Automatic Deployment (CI/CD)

The repository uses GitHub Actions for automated deployments:

- **Frontend**: Automatically deploys to Cloudflare Pages on push to `main`
- **Backend**: Automatically deploys to Cloudflare Workers on push to `main`
- **Database**: Automatically backed up daily at 2 AM UTC

### Manual Deployment

#### Frontend

```bash
cd frontend
npm run build
npx wrangler pages deploy dist --project-name=agile-productions
```

#### Backend

```bash
cd workers
npm run deploy
```

## Environment Variables

### Frontend (Build-time)

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API URL | Yes |
| `VITE_SENTRY_DSN` | Sentry DSN for error tracking | No |

### Backend (Runtime Secrets)

| Secret | Description | Required |
|--------|-------------|----------|
| `JWT_SECRET` | Secret key for JWT signing | Yes |
| `TINYPNG_API_KEY` | TinyPNG API key for image compression | No |
| `SENTRY_DSN` | Sentry DSN for error tracking | No |

### Backend (Environment Variables)

| Variable | Description | Value |
|----------|-------------|-------|
| `ALLOWED_ORIGINS` | CORS allowed origins | `https://agileproductions.in,https://agileproductions.ae,http://localhost:5173` |

## Database

### Migrations

Database migrations are located in `workers/migrations/` and are numbered sequentially.

#### Running Migrations Locally

```bash
cd workers
npx wrangler d1 execute agile-productions-db --local --file=migrations/0001_initial_schema.sql
```

#### Running Migrations in Production

```bash
cd workers
npx wrangler d1 execute agile-productions-db --remote --file=migrations/0001_initial_schema.sql
```

### Schema Overview

- **admins**: Admin user accounts with roles and permissions
- **slider_images**: Hero slider images with display order and positioning
- **gallery_images**: Gallery images with mobile visibility flags
- **client_logos**: Client logos with display order
- **image_storage**: Centralized storage for reusable images
- **activity_logs**: Audit trail of all admin actions

### Backup & Restore

Daily automated backups are stored as GitHub artifacts (90-day retention).

**Manual Backup:**
```bash
cd workers
npx wrangler d1 export agile-productions-db --remote --output=backup.sql
```

**Manual Restore:**
```bash
cd workers
npx wrangler d1 execute agile-productions-db --remote --file=backup.sql
```

## API Documentation

### Authentication

All admin endpoints require JWT authentication via `Authorization: Bearer <token>` header.

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/slider` | Get active slider images |
| GET | `/api/gallery` | Get active gallery images (desktop) |
| GET | `/api/gallery/mobile` | Get active gallery images (mobile) |
| GET | `/api/logos` | Get active client logos |

### Admin Endpoints

#### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login and receive JWT |
| POST | `/api/auth/logout` | Logout and invalidate token |

#### Slider Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/slider` | List all slider images |
| POST | `/api/admin/slider` | Add new slider image |
| PUT | `/api/admin/slider/:id` | Replace slider image |
| PATCH | `/api/admin/slider/:id` | Update slider position only |
| DELETE | `/api/admin/slider/:id` | Delete slider image |
| POST | `/api/admin/slider/reorder` | Reorder slider images |

#### Gallery Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/gallery` | List all gallery images |
| POST | `/api/admin/gallery` | Add new gallery image |
| PUT | `/api/admin/gallery/:id` | Replace gallery image |
| PUT | `/api/admin/gallery/:id/mobile-visibility` | Toggle mobile visibility |
| DELETE | `/api/admin/gallery/:id` | Delete gallery image |

#### Logo Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/logos` | List all logos |
| POST | `/api/admin/logos` | Add new logo |
| DELETE | `/api/admin/logos/:id` | Delete logo |
| POST | `/api/admin/logos/activate` | Activate multiple logos |
| POST | `/api/admin/logos/deactivate` | Deactivate multiple logos |
| POST | `/api/admin/logos/reorder` | Reorder logos |
| POST | `/api/admin/logos/delete-multiple` | Delete multiple logos |

#### Storage Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/storage/:category` | List images by category |
| POST | `/api/admin/storage` | Upload image to storage |
| PUT | `/api/admin/storage/:id` | Rename storage image |
| DELETE | `/api/admin/storage/:id` | Delete storage image |

#### User Management (Super Admin Only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List all users |
| POST | `/api/admin/users` | Create new user |
| PUT | `/api/admin/users/:id` | Update user |
| DELETE | `/api/admin/users/:id` | Delete user |

#### Activity Logs (Super Admin Only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/activity-logs` | List activity logs (paginated) |
| GET | `/api/admin/activity-logs/:id` | Get single activity log |

#### Profile Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/profile` | Get current user profile |
| PUT | `/api/admin/profile` | Update profile information |
| PUT | `/api/admin/profile/password` | Change password |
| POST | `/api/admin/profile/picture` | Upload profile picture |
| DELETE | `/api/admin/profile/picture` | Delete profile picture |

## Testing

### Frontend E2E Tests

```bash
cd frontend
npm run test:e2e              # Run tests headless
npm run test:e2e:headed       # Run tests with browser
npm run test:e2e:ui           # Run tests in UI mode
npm run test:e2e:debug        # Debug tests
```

### Backend Unit Tests

```bash
cd workers
npm test                      # Run all tests
npm run test:watch            # Run in watch mode
npm run test:coverage         # Generate coverage report
```

### Linting

```bash
cd frontend
npm run lint                  # Run ESLint
```

## Contributing

### Workflow

1. Create a new branch from `main`
2. Make your changes
3. Run tests: `npm test` and `npm run test:e2e`
4. Run linter: `npm run lint`
5. Commit with descriptive message (no tool references)
6. Push and create pull request
7. Wait for CI/CD checks to pass
8. Request review

### Commit Message Format

```
<type>: <description>

[optional body]
```

**Types:** feat, fix, docs, style, refactor, test, chore

**Example:**
```
feat: Add object-position editor to slider dashboard

Added comprehensive position control for slider images in the admin dashboard.

Changes:
- Admin UI: Added position editor with 9 presets and custom input option
- Backend: Added PATCH endpoint for lightweight position updates
- Frontend API: Added updateSliderPosition method
```

### Code Style

- **JavaScript**: ES6+ features, async/await for promises
- **React**: Functional components with hooks
- **CSS**: Tailwind utility classes, avoid custom CSS
- **Naming**: camelCase for variables/functions, PascalCase for components

### Branch Protection

The `main` branch is protected:
- Pull requests required for all changes
- Status checks must pass (CI/CD tests)
- No force pushes allowed

## License

Copyright © 2025 Agile Productions. All rights reserved.

---

**Maintained by**: Agile Growth Hackers
**Repository**: https://github.com/Agile-Growth-Hackers/Agile-Productions
