# Auth Microservice - Sistema de Login Integrable

Sistema de autenticación modular y seguro que puede integrarse fácilmente en aplicaciones React.js, con soporte para Azure AD y autenticación tradicional (email/password), utilizando PostgreSQL como base de datos.

## Características

- ✅ Login con email/password tradicional
- ✅ Login con Azure AD (SSO)
- ✅ Registro de usuarios
- ✅ Verificación de email
- ✅ Recuperación de contraseña
- ✅ Gestión de sesiones (JWT + cookies)
- ✅ Panel de administración para gestión de tablas
- ✅ Arquitectura de microservicio contenedorizada

## Stack Tecnológico

- **Backend**: Node.js 18+, Express.js, TypeScript
- **Frontend**: React 18+, React Router
- **Base de Datos**: PostgreSQL 14+
- **Autenticación**: JWT (RS256), Azure AD
- **Contenedores**: Docker, Docker Compose

## Inicio Rápido

### Prerrequisitos

- Node.js 18+ LTS
- Docker y Docker Compose
- PostgreSQL 14+ (o usar el contenedor Docker)

### Instalación

1. Clonar el repositorio
2. Copiar `.env.example` a `.env` y configurar variables
3. Ejecutar migraciones de base de datos
4. Iniciar servicios con Docker Compose

```bash
# Configurar variables de entorno
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Iniciar con Docker Compose
docker-compose up -d

# Ejecutar migraciones
docker-compose exec backend npm run migrate
```

### Ejecutar tests con Docker Compose

Levanta una instancia de PostgreSQL aislada para los tests automatizados usando el compose dedicado, que expone el puerto `5433` y crea la base de datos `auth_db_test`.

```bash
# Arrancar la base de datos de pruebas
docker-compose -f docker-compose.test.yml up -d postgres-test

# (Opcional) Verificar el estado
docker-compose -f docker-compose.test.yml ps

# En otra terminal, instalar dependencias y correr migraciones en el entorno de test
cd backend
npm install
npm run migrate -- --env test

# Ejecutar la suite de pruebas
npm test -- --runInBand
```

## Estructura del Proyecto

```
auth-microservice/
├── backend/          # API Node.js/Express
├── frontend/         # Aplicación React
├── admin-panel/      # Panel de administración
├── docker/           # Configuración Docker
├── docs/             # Documentación
└── scripts/          # Scripts de utilidad
```

## Documentación

Ver [docs/](./docs/) para documentación completa:
- [PRD](./docs/PRD.md) - Product Requirements Document
- [API Documentation](./docs/API.md) - Documentación de la API
- [Deployment Guide](./docs/DEPLOYMENT.md) - Guía de despliegue

## Licencia

MIT

