# Quick Start Guide

## Prerequisites

- Node.js 18+ LTS
- Docker and Docker Compose
- PostgreSQL 14+ (or use Docker)

## Quick Setup (5 minutes)

### 1. Generate JWT Keys

```bash
./scripts/generate-jwt-keys.sh
```

This creates `private.pem` and `public.pem`. Add their contents to your `.env` files.

### 2. Configure Environment Variables

**Backend** - Create `backend/.env`:
```env
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auth_db
JWT_SECRET="-----BEGIN RSA PRIVATE KEY-----
[content of private.pem]
-----END RSA PRIVATE KEY-----"
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
[content of public.pem]
-----END PUBLIC KEY-----"
AZURE_CLIENT_ID=your-azure-client-id
AZURE_CLIENT_SECRET=your-azure-client-secret
AZURE_TENANT_ID=your-azure-tenant-id
AZURE_REDIRECT_URI=http://localhost:3000/api/v1/auth/azure/callback
EMAIL_SERVICE_API_KEY=your-email-api-key
EMAIL_FROM=noreply@example.com
EMAIL_VERIFICATION_URL=http://localhost:3001/verify-email
PASSWORD_RESET_URL=http://localhost:3001/reset-password
ADMIN_PANEL_ENABLED=true
```

**Frontend** - Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_AZURE_CLIENT_ID=your-azure-client-id
VITE_AZURE_TENANT_ID=your-azure-tenant-id
VITE_AZURE_REDIRECT_URI=http://localhost:3001/auth/callback
```

### 3. Start Database

```bash
docker-compose -f docker-compose.dev.yml up -d
```

### 4. Install Dependencies

```bash
# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..

# Admin Panel
cd admin-panel && npm install && cd ..
```

### 5. Run Migrations

```bash
cd backend
npm run migrate
cd ..
```

### 6. Start Services

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 3 - Admin Panel:**
```bash
cd admin-panel
npm run dev
```

### 7. Access Applications

- **Frontend**: http://localhost:3001
- **Admin Panel**: http://localhost:3002
- **Backend API**: http://localhost:3000/api/v1

## Using Docker Compose (Production-like)

```bash
# Build and start all services
docker-compose up -d --build

# Run migrations
docker-compose exec backend npm run migrate

# View logs
docker-compose logs -f
```

## Testing the System

1. **Register a new user** at http://localhost:3001/register
2. **Check email** (in development, check logs for verification link)
3. **Verify email** by visiting the link
4. **Login** at http://localhost:3001/login
5. **Access dashboard** after successful login
6. **Access admin panel** at http://localhost:3002

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps

# View database logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

### Port Already in Use

Modify ports in `docker-compose.yml` or stop conflicting services.

### Migration Errors

```bash
# Rollback last migration
cd backend
npm run migrate:rollback

# Check migration status
npm run migrate:status
```

## Next Steps

- Read [API Documentation](./docs/API.md)
- Review [Deployment Guide](./docs/DEPLOYMENT.md)
- Check [Architecture Documentation](./docs/ARCHITECTURE.md)
- Configure Azure AD (see deployment guide)
- Set up email service (see deployment guide)

