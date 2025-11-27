- Development defaults: 100 auth requests/minute, 20 failed login attempts/minute.
- Production defaults: 5 requests per 15 minutes to block brute-force attacks.
- Override in .env and restart the backend:
  
  RATE_LIMIT_MAX_REQUESTS=50
  RATE_LIMIT_WINDOW_MS=300000
  RATE_LIMIT_LOGIN_MAX_REQUESTS=10
  

### 5.4 Debugging tips

- Tail backend logs: tail -f logs/backend.log. Look for "Application error" entries from error.middleware.ts.
- Use ./scripts/status.sh to ensure PostgreSQL + backend + frontend + admin panel are running.
- Run npm test inside backend/ to ensure APIs still pass unit/integration tests before deploying.

---

## 6. Next steps

- For deployment pipelines, read docs/DEPLOYMENT.md.
- For API-by-API reference, see docs/API.md.
- To extend RBAC or admin features, study the seed/data model in backend/migrations + backend/seeds/001_roles_and_permissions.ts.

Integrating your existing React app is largely about reusing the AuthProvider, api service, and route/UX patterns documented above. Once those pieces are in place, your app can rely on the Auto Microservice for secure authentication, Azure AD SSO, and the admin tooling that ships with this repo.
