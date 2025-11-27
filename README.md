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

### Instalación Rápida

```bash
# 1. Clonar el repositorio
git clone https://github.com/pnmartinez/auth-microservice.git
cd auth-microservice

# 2. Generar JWT keys
./scripts/generate-jwt-keys.sh

# 3. Configurar variables de entorno (ver QUICKSTART.md)

# 4. Instalar dependencias
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
cd admin-panel && npm install && cd ..

# 5. Iniciar todos los servicios
./scripts/start-all.sh

# 6. Verificar estado
./scripts/status.sh
```

### Scripts de Gestión

- `./scripts/start-all.sh` - Inicia todos los servicios
- `./scripts/stop-all.sh` - Detiene todos los servicios
- `./scripts/status.sh` - Muestra el estado de los servicios
- `./scripts/restart.sh` - Reinicia todos los servicios

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

