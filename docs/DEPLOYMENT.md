# Deployment Guide

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for local development)
- PostgreSQL 14+ (or use Docker)
- Azure AD App Registration (for Azure login)

## Local Development Setup

### 1. Clone and Setup

```bash
git clone <repository-url>
cd Login
```

### 2. Generate JWT Keys

Generate RSA key pair for JWT signing:

```bash
# Generate private key
openssl genrsa -out private.pem 2048

# Extract public key
openssl rsa -in private.pem -pubout -out public.pem
```

Add the keys to your `.env` files (see Configuration section).

### 3. Configure Environment Variables

**Backend** (`backend/.env`):
```env
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auth_db
JWT_SECRET=<private key content>
JWT_PUBLIC_KEY=<public key content>
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

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_AZURE_CLIENT_ID=your-azure-client-id
VITE_AZURE_TENANT_ID=your-azure-tenant-id
VITE_AZURE_REDIRECT_URI=http://localhost:3001/auth/callback
```

### 4. Start Database (Development)

```bash
docker-compose -f docker-compose.dev.yml up -d
```

### 5. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# Admin Panel
cd ../admin-panel
npm install
```

### 6. Run Migrations

```bash
cd backend
npm run migrate
```

### 7. Start Services

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

## Docker Deployment

### 1. Build and Start

```bash
# Create .env file in root with all required variables
docker-compose up -d --build
```

### 2. Run Migrations

```bash
docker-compose exec backend npm run migrate
```

### 3. Check Status

```bash
docker-compose ps
docker-compose logs -f backend
```

## Production Deployment

### Environment Variables

Set all required environment variables in your hosting platform:

- Database connection string
- JWT keys (RSA private/public)
- Azure AD credentials
- Email service API key
- CORS origins
- Admin panel enabled flag

### Security Checklist

- [ ] Use HTTPS/TLS in production
- [ ] Set secure cookie flags (`secure`, `sameSite`)
- [ ] Use strong JWT keys (2048+ bits)
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Use environment variables for secrets
- [ ] Enable database backups
- [ ] Set up monitoring and logging
- [ ] Review and restrict admin access

### Database Backups

```bash
# Backup
docker-compose exec postgres pg_dump -U postgres auth_db > backup.sql

# Restore
docker-compose exec -T postgres psql -U postgres auth_db < backup.sql
```

### Health Checks

- Backend: `http://localhost:3000/health`
- Readiness: `http://localhost:3000/ready`

## Azure AD Configuration

1. Go to Azure Portal → App Registrations
2. Create new registration
3. Configure:
   - Redirect URIs: `http://localhost:3000/api/v1/auth/azure/callback`
   - API permissions: `openid`, `profile`, `email`
4. Create client secret
5. Copy Client ID, Tenant ID, and Client Secret to `.env`

## Email Service Setup

The email service is currently a stub. To enable actual email sending:

1. Choose a provider (SendGrid, Mailgun, AWS SES, etc.)
2. Update `backend/src/services/email.service.ts`
3. Add provider SDK to `backend/package.json`
4. Configure API key in environment variables

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres psql -U postgres -d auth_db
```

### Migration Issues

```bash
# Rollback last migration
cd backend
npm run migrate:rollback

# Check migration status
docker-compose exec backend npm run migrate:status
```

### Port Conflicts

If ports are already in use, modify `docker-compose.yml`:

```yaml
ports:
  - "3001:3000"  # Change host port
```

## Scaling

For horizontal scaling:

1. Use external PostgreSQL database
2. Configure load balancer
3. Use Redis for session storage (optional)
4. Set up multiple backend instances
5. Configure sticky sessions or stateless JWT

## Monitoring

Recommended monitoring:

- Application logs (Winston)
- Database performance
- API response times
- Error rates
- Failed login attempts
- Active sessions

