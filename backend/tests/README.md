# Testing Guide

## Prerequisites

1. **PostgreSQL Database**: A test database must be running
   ```bash
   # Using Docker
   docker run -d --name auth-test-db \
     -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_DB=auth_db_test \
     -p 5433:5432 \
     postgres:14-alpine
   ```

2. **Environment Variables**: Create `.env.test` file (already created)
   ```env
   NODE_ENV=test
   DATABASE_URL=postgresql://postgres:postgres@localhost:5433/auth_db_test
   ```

3. **Run Migrations**: Set up test database schema
   ```bash
   NODE_ENV=test npm run migrate
   ```

4. **Run Seeds**: Set up initial roles and permissions
   ```bash
   NODE_ENV=test npm run seed
   ```

## Running Tests

### All Tests
```bash
NODE_ENV=test npm test
```

### Watch Mode
```bash
NODE_ENV=test npm run test:watch
```

### Coverage Report
```bash
NODE_ENV=test npm run test:coverage
```

### Specific Test File
```bash
NODE_ENV=test npm test -- tests/services/auth.service.test.ts
```

### Specific Test Pattern
```bash
NODE_ENV=test npm test -- --testNamePattern="should login successfully"
```

## Test Structure

### Unit Tests (`tests/services/`)
- `auth.service.test.ts` - Authentication service tests
- `role.service.test.ts` - Role and permission service tests

### Integration Tests (`tests/integration/`)
- `auth.routes.test.ts` - Authentication API endpoint tests
- `admin.routes.test.ts` - Admin API endpoint tests

### Test Helpers (`tests/utils/`)
- `test-helpers.ts` - Utility functions for creating test data

## Test Coverage

Current test coverage includes:

✅ **AuthService**
- User registration
- User login
- Email verification
- Password reset
- Error handling

✅ **RoleService**
- Role assignment
- Permission checking
- Role validation

✅ **API Endpoints**
- Authentication routes
- Admin routes
- Error responses
- Authorization

## Troubleshooting

### Database Connection Errors
If you see `ECONNREFUSED` errors:
1. Ensure PostgreSQL is running
2. Check DATABASE_URL in `.env.test`
3. Verify database exists: `createdb auth_db_test`

### Migration Errors
If tests fail due to missing tables:
```bash
NODE_ENV=test npm run migrate
NODE_ENV=test npm run seed
```

### Port Conflicts
If port 5432 is in use, change the test database port in `.env.test`:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/auth_db_test
```

## Continuous Integration

For CI/CD pipelines, ensure:
1. PostgreSQL service is available
2. Test database is created before running tests
3. Migrations and seeds are run before tests
4. Environment variables are set correctly

Example GitHub Actions:
```yaml
- name: Setup PostgreSQL
  run: |
    docker run -d --name test-db \
      -e POSTGRES_PASSWORD=postgres \
      -e POSTGRES_DB=auth_db_test \
      -p 5432:5432 postgres:14-alpine

- name: Run migrations
  run: NODE_ENV=test npm run migrate

- name: Run seeds
  run: NODE_ENV=test npm run seed

- name: Run tests
  run: NODE_ENV=test npm test
```

