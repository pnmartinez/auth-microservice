# Architecture Documentation

## System Overview

The authentication microservice is a containerized, modular system designed for easy integration into React.js applications. It provides both traditional email/password authentication and Azure AD SSO.

## Architecture Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │────▶│ PostgreSQL  │
│  (React)    │     │  (Express)  │     │  Database   │
└─────────────┘     └─────────────┘     └─────────────┘
      │                    │
      │                    │
      ▼                    ▼
┌─────────────┐     ┌─────────────┐
│ Admin Panel │     │  Azure AD   │
│  (React)    │     │     SSO     │
└─────────────┘     └─────────────┘
```

## Components

### Backend (Node.js/Express)

**Structure:**
```
backend/
├── src/
│   ├── config/        # Configuration (DB, JWT, Azure)
│   ├── controllers/   # Request handlers
│   ├── middleware/    # Auth, validation, rate limiting
│   ├── routes/        # API routes
│   ├── services/      # Business logic
│   └── utils/         # Utilities
├── migrations/        # Database migrations
└── app.ts            # Application entry point
```

**Key Features:**
- RESTful API design
- JWT authentication (RS256)
- Rate limiting
- Input validation
- Security headers (Helmet)
- CORS configuration
- Structured logging

### Frontend (React)

**Structure:**
```
frontend/
├── src/
│   ├── components/    # UI components
│   ├── contexts/       # React Context (Auth)
│   ├── hooks/         # Custom hooks
│   ├── services/      # API client
│   └── utils/         # Utilities
```

**Key Features:**
- React Router for navigation
- Context API for state management
- Protected routes
- Automatic token refresh
- Azure AD integration (MSAL)

### Admin Panel (React)

**Structure:**
```
admin-panel/
├── src/
│   ├── components/    # Admin UI components
│   └── services/      # API client
```

**Features:**
- User management
- Token management
- Security logs
- Database table viewer
- Statistics dashboard

### Database (PostgreSQL)

**Tables:**
- `users` - User accounts
- `email_verifications` - Email verification tokens
- `password_resets` - Password reset tokens
- `refresh_tokens` - Active refresh tokens
- `login_attempts` - Security audit log

## Authentication Flow

### Email/Password Flow

1. User submits credentials
2. Backend validates and hashes password
3. Backend generates JWT access token (15min)
4. Backend generates refresh token (7 days, stored in DB)
5. Access token returned in response
6. Refresh token set as HTTP-only cookie
7. Frontend stores access token in memory
8. On token expiry, frontend uses refresh token to get new access token

### Azure AD Flow

1. User clicks "Login with Azure"
2. Frontend redirects to Azure AD
3. User authenticates with Azure
4. Azure redirects to backend callback with code
5. Backend exchanges code for tokens
6. Backend validates ID token
7. Backend creates/updates user
8. Backend generates own JWT tokens
9. Backend redirects to frontend with access token

## Security Measures

### Backend Security

- **Password Hashing**: bcrypt with 12+ salt rounds
- **JWT Signing**: RS256 (asymmetric)
- **Rate Limiting**: Per IP and per email
- **Input Validation**: express-validator
- **SQL Injection Protection**: Prepared statements (Knex)
- **XSS Protection**: Helmet headers
- **CSRF Protection**: SameSite cookies
- **Error Handling**: No sensitive data in errors

### Frontend Security

- **Token Storage**: Access token in memory, refresh token in HTTP-only cookie
- **Route Protection**: React Router guards
- **Auto Logout**: On token expiration
- **Secure Communication**: HTTPS in production

### Database Security

- **Prepared Statements**: All queries use parameterized statements
- **Indexes**: Optimized for performance
- **Constraints**: Foreign keys, unique constraints
- **Connection Pooling**: Managed by Knex

## Data Flow

### Registration Flow

```
User → Frontend → Backend → [Validate] → [Hash Password] → Database
                                    ↓
                              [Generate Token] → Email Service
```

### Login Flow

```
User → Frontend → Backend → [Validate] → [Check Rate Limit] → [Verify Password]
                                                                    ↓
                                                              [Generate Tokens]
                                                                    ↓
                                                              Frontend ← Tokens
```

### Token Refresh Flow

```
Frontend → Backend → [Validate Refresh Token] → [Check DB] → [Generate New Access Token]
                                                                    ↓
                                                              Frontend ← New Token
```

## API Design

### RESTful Principles

- Resource-based URLs
- HTTP methods (GET, POST, PATCH, DELETE)
- Status codes (200, 201, 400, 401, 403, 404, 500)
- JSON request/response
- Consistent error format

### Versioning

- Base path: `/api/v1`
- Future versions: `/api/v2`

## Scalability Considerations

### Current Design

- Stateless JWT tokens (horizontal scaling ready)
- Database connection pooling
- No session storage required

### Future Enhancements

- Redis for token blacklisting
- Database read replicas
- CDN for static assets
- Load balancer configuration
- Microservice decomposition

## Monitoring and Logging

### Logging

- Structured JSON logs (Winston)
- Log levels: error, warn, info
- Request/response logging
- Security event logging

### Health Checks

- `/health` - Liveness probe
- `/ready` - Readiness probe (checks DB)

## Error Handling

### Error Types

- **Validation Errors**: 400 Bad Request
- **Authentication Errors**: 401 Unauthorized
- **Authorization Errors**: 403 Forbidden
- **Not Found**: 404 Not Found
- **Server Errors**: 500 Internal Server Error

### Error Response Format

```json
{
  "error": "Error message"
}
```

## Deployment Architecture

### Docker Compose

- **postgres**: Database service
- **backend**: API service
- **frontend**: Frontend application (nginx)
- **admin-panel**: Admin interface (nginx)

### Networking

- Services communicate via Docker network
- Frontend proxies API calls to backend
- All services accessible via exposed ports

## Development vs Production

### Development

- Hot reload enabled
- Detailed error messages
- Console logging
- Local database

### Production

- Compiled/bundled code
- Generic error messages
- Structured logging
- Production database
- HTTPS/TLS
- Security headers enabled

