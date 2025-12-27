# Agile Productions API Documentation

Complete API reference for the Agile Productions backend.

**Base URL:** `https://agile-productions-api.cool-bonus-e67f.workers.dev` (Production)

**Version:** v1

**Authentication:** Bearer Token (JWT)

## Table of Contents

- [Authentication](#authentication)
- [Public Endpoints](#public-endpoints)
- [Admin Endpoints](#admin-endpoints)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Security](#security)

---

## Authentication

### Login

Authenticate and receive a JWT token and CSRF token.

```http
POST /api/auth/login
POST /api/v1/auth/login
```

**Request Body:**
```json
{
  "username": "admin@example.com",
  "password": "securepassword"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin@example.com",
    "fullName": "Admin User",
    "email": "admin@example.com",
    "isSuperAdmin": false,
    "profilePictureUrl": "https://..."
  },
  "csrfToken": "random-csrf-token",
  "csrfHeader": "x-csrf-token"
}
```

**Error Responses:**
- `400 Bad Request`: Missing username or password
- `401 Unauthorized`: Invalid credentials or inactive account
- `429 Too Many Requests`: Rate limit exceeded (5 failed attempts = 15min lockout)

**Rate Limiting:** 5 failed attempts locks the account for 15 minutes

**Notes:**
- CSRF token must be included in `x-csrf-token` header for all authenticated state-changing requests
- JWT token should be sent in `Authorization: Bearer {token}` header

### Logout

Invalidate current session.

```http
POST /api/auth/logout
POST /api/v1/auth/logout
```

**Headers:**
```
Authorization: Bearer {token}
x-csrf-token: {csrf_token}
```

**Response (200 OK):**
```json
{
  "success": true
}
```

---

## Public Endpoints

These endpoints do not require authentication.

### Get Slider Images

Retrieve active slider images for homepage carousel.

```http
GET /api/slider
GET /api/v1/slider
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "cdn_url": "https://r2.agileproductions.in/slider/image1.webp",
    "object_position": "center center",
    "display_order": 1
  }
]
```

**Device Detection:**
- Automatically returns mobile-optimized images for mobile devices
- Detects via User-Agent header

**Rate Limiting:** 60 requests/minute per IP

### Get Gallery Images

Retrieve active gallery images.

```http
GET /api/gallery
GET /api/v1/gallery
GET /api/gallery/mobile
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "cdn_url": "https://r2.agileproductions.in/gallery/image1.webp",
    "display_order": 1
  }
]
```

**Mobile Endpoint:**
- `/api/gallery/mobile`: Returns only mobile-visible images (max 10)

**Rate Limiting:** 60 requests/minute per IP

### Get Client Logos

Retrieve active client logos.

```http
GET /api/logos
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "cdn_url": "https://r2.agileproductions.in/logos/client1.webp",
    "alt_text": "Client Name",
    "display_order": 1
  }
]
```

**Rate Limiting:** 60 requests/minute per IP

### Health Check

Check API and service health.

```http
GET /
GET /health
```

**Root Response (200 OK):**
```json
{
  "status": "ok",
  "message": "Agile Productions API"
}
```

**Health Endpoint Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "checks": {
    "database": { "status": "healthy" },
    "storage": { "status": "healthy" },
    "tinypng": { "status": "configured" }
  }
}
```

**Status Codes:**
- `200`: Healthy or degraded
- `503`: Unhealthy

---

## Admin Endpoints

All admin endpoints require authentication and CSRF protection.

**Required Headers:**
```
Authorization: Bearer {token}
x-csrf-token: {csrf_token}
```

**Rate Limiting:** 300 requests/minute per user

### Storage Management

#### List Storage Images

```http
GET /api/admin/storage/{category}
GET /api/v1/admin/storage/{category}
```

**Parameters:**
- `category`: Category name (e.g., "slider", "gallery", "logos")

**Response (200 OK):**
```json
[
  {
    "id": "path/to/image.webp",
    "url": "https://r2.agileproductions.in/path/to/image.webp",
    "size": 102400,
    "uploaded": "2025-01-01T00:00:00.000Z"
  }
]
```

#### Upload Image

```http
POST /api/admin/storage
POST /api/v1/admin/storage
```

**Content-Type:** `multipart/form-data`

**Form Data:**
- `image`: File (required)
- `category`: String (required)

**Response (200 OK):**
```json
{
  "success": true,
  "url": "https://r2.agileproductions.in/path/to/image.webp",
  "r2Key": "path/to/image.webp"
}
```

**Error Responses:**
- `400 Bad Request`: Missing image or category
- `413 Payload Too Large`: File exceeds size limit (10 MB)

#### Delete Image

```http
DELETE /api/admin/storage/{id}
DELETE /api/v1/admin/storage/{id}
```

**Parameters:**
- `id`: R2 object key (URL-encoded)

**Response (200 OK):**
```json
{
  "success": true
}
```

#### Rename Image

```http
PUT /api/admin/storage/{id}
PUT /api/v1/admin/storage/{id}
```

**Request Body:**
```json
{
  "filename": "new-name.webp"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "url": "https://r2.agileproductions.in/path/to/new-name.webp"
}
```

### Slider Management

#### List All Slider Images

```http
GET /api/admin/slider
GET /api/v1/admin/slider
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "cdn_url": "https://...",
    "cdn_url_mobile": "https://...",
    "object_position": "center center",
    "display_order": 1,
    "is_active": 1
  }
]
```

#### Add Slider Image

```http
POST /api/admin/slider
POST /api/v1/admin/slider
```

**Option 1: Upload New Image**

**Content-Type:** `multipart/form-data`

**Form Data:**
- `image`: File (required)
- `objectPosition`: String (default: "center center")

**Option 2: Use Existing Image**

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "r2Key": "path/to/image.webp",
  "objectPosition": "center center"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "id": 1
}
```

#### Update Slider Image

```http
PUT /api/admin/slider/{id}
PUT /api/v1/admin/slider/{id}
```

**Request Body (JSON):**
```json
{
  "objectPosition": "top center",
  "isActive": true
}
```

**Or upload new image (multipart/form-data):**
- `image`: File

**Response (200 OK):**
```json
{
  "success": true
}
```

#### Delete Slider Image

```http
DELETE /api/admin/slider/{id}
DELETE /api/v1/admin/slider/{id}
```

**Response (200 OK):**
```json
{
  "success": true
}
```

#### Reorder Slider Images

```http
POST /api/admin/slider/reorder
POST /api/v1/admin/slider/reorder
```

**Request Body:**
```json
{
  "order": [3, 1, 2, 4]
}
```

**Response (200 OK):**
```json
{
  "success": true
}
```

### Gallery Management

Similar to Slider Management with these endpoints:

```
GET    /api/admin/gallery
POST   /api/admin/gallery
PUT    /api/admin/gallery/{id}
DELETE /api/admin/gallery/{id}
PUT    /api/admin/gallery/{id}/mobile-visibility
```

#### Toggle Mobile Visibility

```http
PUT /api/admin/gallery/{id}/mobile-visibility
PUT /api/v1/admin/gallery/{id}/mobile-visibility
```

**Request Body:**
```json
{
  "visible": true
}
```

### Logos Management

Similar structure to Slider/Gallery with additional batch operations:

```
GET    /api/admin/logos
POST   /api/admin/logos
DELETE /api/admin/logos/{id}
POST   /api/admin/logos/reorder
POST   /api/admin/logos/activate
POST   /api/admin/logos/deactivate
POST   /api/admin/logos/delete-multiple
```

#### Activate Logos

```http
POST /api/admin/logos/activate
POST /api/v1/admin/logos/activate
```

**Request Body:**
```json
{
  "ids": [1, 2, 3]
}
```

#### Deactivate Logos

```http
POST /api/admin/logos/deactivate
POST /api/v1/admin/logos/deactivate
```

**Request Body:**
```json
{
  "ids": [1, 2, 3]
}
```

#### Delete Multiple Logos

```http
POST /api/admin/logos/delete-multiple
POST /api/v1/admin/logos/delete-multiple
```

**Request Body:**
```json
{
  "ids": [1, 2, 3]
}
```

### Usage Statistics

```http
GET /api/admin/usage
GET /api/v1/admin/usage
```

**Response (200 OK):**
```json
{
  "storage": {
    "used": "512 MB",
    "limit": "10 GB",
    "percentage": 5
  },
  "bandwidth": {
    "used": "1.2 GB",
    "limit": "100 GB"
  },
  "requests": {
    "today": 1234,
    "thisMonth": 45678
  }
}
```

### User Management (Super Admin Only)

#### List Users

```http
GET /api/admin/users
GET /api/v1/admin/users
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "fullName": "Admin User",
    "isSuperAdmin": false,
    "isActive": true,
    "lastLogin": "2025-01-01T00:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### Create User

```http
POST /api/admin/users
POST /api/v1/admin/users
```

**Request Body:**
```json
{
  "username": "newadmin",
  "email": "newadmin@example.com",
  "password": "securepassword",
  "fullName": "New Admin",
  "isSuperAdmin": false
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "userId": 2
}
```

#### Update User

```http
PUT /api/admin/users/{id}
PUT /api/v1/admin/users/{id}
```

**Request Body:**
```json
{
  "email": "updated@example.com",
  "fullName": "Updated Name",
  "isActive": true
}
```

**Response (200 OK):**
```json
{
  "success": true
}
```

#### Delete User

```http
DELETE /api/admin/users/{id}
DELETE /api/v1/admin/users/{id}
```

**Response (200 OK):**
```json
{
  "success": true
}
```

### Activity Logs (Super Admin Only)

#### List Activity Logs

```http
GET /api/admin/activity-logs?page=1&limit=50&adminId=1&actionType=login_success
GET /api/v1/admin/activity-logs?page=1&limit=50
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50, max: 100)
- `adminId`: Filter by admin user ID
- `actionType`: Filter by action type

**Response (200 OK):**
```json
{
  "logs": [
    {
      "id": 1,
      "adminId": 1,
      "adminUsername": "admin",
      "actionType": "login_success",
      "entityType": "auth",
      "description": "Successful login",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1234,
    "totalPages": 25
  }
}
```

#### Get Activity Log

```http
GET /api/admin/activity-logs/{id}
GET /api/v1/admin/activity-logs/{id}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "adminId": 1,
  "adminUsername": "admin",
  "actionType": "login_success",
  "entityType": "auth",
  "entityId": null,
  "description": "Successful login",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "metadata": null,
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

### Profile Management

#### Get Profile

```http
GET /api/admin/profile
GET /api/v1/admin/profile
```

**Response (200 OK):**
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@example.com",
  "fullName": "Admin User",
  "isSuperAdmin": false,
  "profilePictureUrl": "https://...",
  "lastLogin": "2025-01-01T00:00:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### Update Profile

```http
PUT /api/admin/profile
PUT /api/v1/admin/profile
```

**Request Body:**
```json
{
  "email": "newemail@example.com",
  "fullName": "Updated Name"
}
```

**Response (200 OK):**
```json
{
  "success": true
}
```

#### Update Password

```http
PUT /api/admin/profile/password
PUT /api/v1/admin/profile/password
```

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newsecurepassword"
}
```

**Response (200 OK):**
```json
{
  "success": true
}
```

**Error Responses:**
- `400 Bad Request`: Passwords don't meet requirements
- `401 Unauthorized`: Current password incorrect

#### Upload Profile Picture

```http
POST /api/admin/profile/picture
POST /api/v1/admin/profile/picture
```

**Content-Type:** `multipart/form-data`

**Form Data:**
- `image`: File (required)

**Response (200 OK):**
```json
{
  "success": true,
  "url": "https://r2.agileproductions.in/profiles/user1.webp"
}
```

#### Delete Profile Picture

```http
DELETE /api/admin/profile/picture
DELETE /api/v1/admin/profile/picture
```

**Response (200 OK):**
```json
{
  "success": true
}
```

---

## Error Handling

### Standard Error Response

```json
{
  "error": "Error message describing what went wrong"
}
```

### Common HTTP Status Codes

- `200 OK`: Request successful
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Valid auth but insufficient permissions / CSRF token invalid
- `404 Not Found`: Resource not found
- `413 Payload Too Large`: File/request too large
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

### CSRF Error

```json
{
  "error": "Invalid or missing CSRF token",
  "code": "CSRF_TOKEN_INVALID"
}
```

**How to fix:**
- Include CSRF token from login response in `x-csrf-token` header
- Only required for state-changing requests (POST/PUT/DELETE/PATCH)
- Login endpoint exempt from CSRF protection

---

## Rate Limiting

### Public API

- **Limit:** 60 requests/minute per IP
- **Applies to:** `/api/slider`, `/api/gallery`, `/api/logos`
- **Headers Returned:**
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Time when limit resets

### Admin API

- **Limit:** 300 requests/minute per authenticated user
- **Applies to:** All `/api/admin/*` endpoints

### Login Rate Limiting

- **Limit:** 5 failed attempts per username
- **Lockout:** 15 minutes
- **Applies to:** `/api/auth/login`

### Rate Limit Response (429)

```json
{
  "error": "Too many requests. Please try again later."
}
```

---

## Security

### Authentication

- **Method:** JWT (JSON Web Tokens)
- **Algorithm:** HS256
- **Expiration:** Configurable (default: 24 hours)
- **Storage:** Client-side (localStorage or secure cookie)

### CSRF Protection

- **Method:** Double-submit cookie pattern
- **Token Generation:** Crypto-secure random (32 bytes)
- **Token Hashing:** SHA-256
- **Cookie Flags:** HttpOnly, Secure, SameSite=Strict
- **Protected Methods:** POST, PUT, DELETE, PATCH
- **Exempt Routes:** `/api/auth/login`

### Security Headers

All responses include:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`

### HTTPS Enforcement

- All HTTP requests automatically redirect to HTTPS
- HSTS header included in production

### Request Size Limits

- **Max Body Size:** 10 MB
- **Max File Upload:** 10 MB
- Exceeding limits returns `413 Payload Too Large`

### Password Requirements

- Minimum 8 characters
- Hashed using bcrypt (cost factor: 10)
- Never stored in plaintext

### Activity Logging

All admin actions are logged with:
- User ID and username
- Action type and description
- IP address
- User agent
- Timestamp

Logs automatically deleted after 30 days.

---

## Versioning

Current API version: **v1**

### Version Support

- **Current:** `/api/v1/*` (recommended)
- **Legacy:** `/api/*` (backwards compatible)

Both versions are currently identical. Use versioned endpoints for future-proofing.

### Deprecation Policy

- 6 months notice before deprecating endpoints
- Version announcements via email and documentation

---

## SDK & Client Libraries

### JavaScript/TypeScript

```javascript
import api from './services/api';

// Login
const { token, csrfToken } = await api.login('username', 'password');

// Authenticated request
const sliderImages = await api.getAllSliderImages();
```

See `frontend/src/services/api.js` for reference implementation.

---

## Support

**Issues:** https://github.com/Agile-Growth-Hackers/Agile-Productions/issues

**Email:** support@agileproductions.in

---

## Changelog

### v1.0.0 (2025-01-01)
- Initial API release
- Public endpoints for slider, gallery, logos
- Admin endpoints for content management
- User management (super admin)
- Activity logging
- CSRF protection
- Rate limiting
- Comprehensive error handling
