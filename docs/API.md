# API Documentation

## Base URL

```
http://localhost:3000/api/v1
```

## Authentication

Most endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Public Endpoints

### Register

Create a new user account.

**POST** `/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:** `201 Created`
```json
{
  "message": "User registered successfully. Please check your email for verification.",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

### Login

Authenticate with email and password.

**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "jwt_token",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "emailVerified": true
  }
}
```

**Cookies:** Sets `refreshToken` as HTTP-only cookie.

### Azure Login

Initiate Azure AD authentication.

**GET** `/auth/azure`

**Response:** `200 OK`
```json
{
  "authUrl": "https://login.microsoftonline.com/..."
}
```

### Azure Callback

Handle Azure AD callback (used internally).

**GET** `/auth/azure/callback?code=...`

Redirects to frontend with access token.

### Verify Email

Verify email address with token.

**GET** `/auth/verify-email?token=...`

**Response:** `200 OK`
```json
{
  "message": "Email verified successfully"
}
```

### Resend Verification

Resend verification email.

**POST** `/auth/resend-verification`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

### Request Password Reset

Request password reset email.

**POST** `/auth/password-reset`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:** `200 OK`
```json
{
  "message": "If the email exists, a password reset link has been sent"
}
```

### Reset Password

Reset password with token.

**POST** `/auth/password-reset/confirm`

**Request Body:**
```json
{
  "token": "reset_token",
  "password": "NewSecurePass123"
}
```

### Refresh Token

Get new access token using refresh token.

**POST** `/auth/refresh`

**Request Body (optional if cookie is set):**
```json
{
  "refreshToken": "refresh_token"
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "new_jwt_token"
}
```

## Protected Endpoints

### Get Current User

Get authenticated user information.

**GET** `/auth/me`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "emailVerified": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "lastLogin": "2024-01-01T00:00:00Z"
  }
}
```

### Logout

Invalidate refresh token and logout.

**POST** `/auth/logout`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "message": "Logged out successfully"
}
```

## Admin Endpoints

All admin endpoints require authentication and admin role.

### Get Users

List all users with pagination.

**GET** `/admin/users?page=1&limit=20&search=email`

**Response:** `200 OK`
```json
{
  "users": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Get User by ID

Get detailed user information.

**GET** `/admin/users/:id`

**Response:** `200 OK`
```json
{
  "user": {...},
  "refreshTokens": [...],
  "recentLoginAttempts": [...]
}
```

### Update User

Update user status.

**PATCH** `/admin/users/:id`

**Request Body:**
```json
{
  "is_active": true,
  "email_verified": true
}
```

### Get Refresh Tokens

List refresh tokens.

**GET** `/admin/tokens?page=1&limit=20&userId=uuid`

### Revoke Token

Revoke a refresh token.

**POST** `/admin/tokens/:id/revoke`

### Get Login Attempts

View login attempt logs.

**GET** `/admin/login-attempts?page=1&limit=50&email=user@example.com`

### Get Statistics

Get dashboard statistics.

**GET** `/admin/stats`

**Response:** `200 OK`
```json
{
  "users": {
    "total": 100,
    "active": 95,
    "verified": 90
  },
  "sessions": {
    "active": 50
  },
  "security": {
    "failedLoginsLast24h": 5
  }
}
```

### Get Table Data

View raw database table data.

**GET** `/admin/tables/:table?page=1&limit=50`

**Tables:** `users`, `email_verifications`, `password_resets`, `refresh_tokens`, `login_attempts`

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message"
}
```

**Status Codes:**
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

- Auth endpoints: 5 requests per 15 minutes per IP
- Admin endpoints: 30 requests per minute per IP

