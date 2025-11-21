# Guía de Integración con Azure AD

Esta guía te ayudará a configurar e integrar Azure Active Directory (Azure AD) con el sistema de autenticación.

## Tabla de Contenidos

1. [Prerrequisitos](#prerrequisitos)
2. [Registro de Aplicación en Azure](#registro-de-aplicación-en-azure)
3. [Configuración del Backend](#configuración-del-backend)
4. [Configuración del Frontend](#configuración-del-frontend)
5. [Flujo de Autenticación](#flujo-de-autenticación)
6. [Troubleshooting](#troubleshooting)
7. [Seguridad](#seguridad)

## Prerrequisitos

- Cuenta de Azure con suscripción activa
- Acceso al Azure Portal
- Permisos para crear App Registrations
- Node.js y npm instalados
- PostgreSQL configurado

## Registro de Aplicación en Azure

### Paso 1: Crear App Registration

1. Ve al [Azure Portal](https://portal.azure.com)
2. Busca "Azure Active Directory" o "Microsoft Entra ID"
3. En el menú lateral, selecciona **App registrations**
4. Haz clic en **New registration**

### Paso 2: Configurar la Aplicación

**Nombre de la aplicación:**
```
Auth Microservice - Login System
```

**Tipos de cuenta admitidos:**
- Selecciona según tu caso:
  - **Single tenant**: Solo usuarios de tu organización
  - **Multi-tenant**: Cualquier cuenta de Azure AD
  - **Multi-tenant + personal Microsoft accounts**: Cualquier cuenta Microsoft

**URI de redirección:**
- Plataforma: **Web**
- URI: `http://localhost:3000/api/v1/auth/azure/callback` (desarrollo)
- Para producción: `https://tu-dominio.com/api/v1/auth/azure/callback`

### Paso 3: Guardar Información Importante

Después de crear la aplicación, guarda:

- **Application (client) ID**: Lo necesitarás como `AZURE_CLIENT_ID`
- **Directory (tenant) ID**: Lo necesitarás como `AZURE_TENANT_ID`

### Paso 4: Crear Client Secret

1. En la página de tu App Registration, ve a **Certificates & secrets**
2. Haz clic en **New client secret**
3. Agrega una descripción (ej: "Production Secret")
4. Selecciona el período de expiración (recomendado: 24 meses)
5. Haz clic en **Add**
6. **IMPORTANTE**: Copia el **Value** del secret inmediatamente (solo se muestra una vez)
   - Este será tu `AZURE_CLIENT_SECRET`

### Paso 5: Configurar API Permissions

1. Ve a **API permissions**
2. Haz clic en **Add a permission**
3. Selecciona **Microsoft Graph**
4. Selecciona **Delegated permissions**
5. Agrega los siguientes permisos:
   - `openid` (ya incluido por defecto)
   - `profile` (ya incluido por defecto)
   - `email` (ya incluido por defecto)
   - `User.Read` (opcional, para leer perfil del usuario)

6. Haz clic en **Add permissions**
7. Si es necesario, haz clic en **Grant admin consent** para tu organización

### Paso 6: Configurar Authentication

1. Ve a **Authentication**
2. En **Redirect URIs**, asegúrate de tener:
   - `http://localhost:3000/api/v1/auth/azure/callback` (desarrollo)
   - `https://tu-dominio.com/api/v1/auth/azure/callback` (producción)
3. En **Implicit grant and hybrid flows**, marca:
   - ✅ **ID tokens** (para iniciar sesión con flujo de código de autorización)
4. Haz clic en **Save**

## Configuración del Backend

### Paso 1: Variables de Entorno

Edita `backend/.env` y agrega:

```env
# Azure AD Configuration
AZURE_CLIENT_ID=tu-client-id-aqui
AZURE_CLIENT_SECRET=tu-client-secret-aqui
AZURE_TENANT_ID=tu-tenant-id-aqui
AZURE_REDIRECT_URI=http://localhost:3000/api/v1/auth/azure/callback
AZURE_AUTHORITY=https://login.microsoftonline.com/tu-tenant-id
```

**Para producción:**
```env
AZURE_REDIRECT_URI=https://tu-dominio.com/api/v1/auth/azure/callback
AZURE_AUTHORITY=https://login.microsoftonline.com/tu-tenant-id
```

### Paso 2: Verificar Instalación de Dependencias

Asegúrate de tener instalado `@azure/msal-node`:

```bash
cd backend
npm install @azure/msal-node
```

### Paso 3: Probar la Configuración

1. Inicia el servidor:
```bash
npm run dev
```

2. Prueba el endpoint de login:
```bash
curl http://localhost:3000/api/v1/auth/azure
```

Deberías recibir una URL de autenticación de Azure.

## Configuración del Frontend

### Paso 1: Variables de Entorno

Edita `frontend/.env` y agrega:

```env
VITE_AZURE_CLIENT_ID=tu-client-id-aqui
VITE_AZURE_TENANT_ID=tu-tenant-id-aqui
VITE_AZURE_REDIRECT_URI=http://localhost:3001/auth/callback
```

**Para producción:**
```env
VITE_AZURE_REDIRECT_URI=https://tu-dominio.com/auth/callback
```

### Paso 2: Verificar Instalación

Asegúrate de tener instalado `@azure/msal-react` y `@azure/msal-browser`:

```bash
cd frontend
npm install @azure/msal-react @azure/msal-browser
```

### Paso 3: Configurar MSAL

El archivo `frontend/src/utils/azureConfig.ts` ya está configurado. Solo verifica que las variables de entorno estén correctas.

## Flujo de Autenticación

### Flujo Completo

```
1. Usuario hace clic en "Login with Azure AD"
   ↓
2. Frontend redirige a: GET /api/v1/auth/azure
   ↓
3. Backend genera URL de Azure AD y la retorna
   ↓
4. Frontend redirige al usuario a Azure AD
   ↓
5. Usuario se autentica en Azure AD
   ↓
6. Azure AD redirige a: GET /api/v1/auth/azure/callback?code=...
   ↓
7. Backend intercambia code por tokens
   ↓
8. Backend verifica ID token (firma, expiración, audiencia)
   ↓
9. Backend extrae información del usuario (email, azure_id)
   ↓
10. Backend crea/actualiza usuario en base de datos
    ↓
11. Backend genera JWT tokens propios
    ↓
12. Backend redirige a frontend con access token
    ↓
13. Frontend almacena token y autentica al usuario
```

### Código de Ejemplo

#### Backend - Iniciar Login Azure

```typescript
// GET /api/v1/auth/azure
const authUrl = azureService.getAuthUrl();
res.json({ authUrl });
```

#### Backend - Callback

```typescript
// GET /api/v1/auth/azure/callback?code=...
const tokenResponse = await azureService.exchangeCodeForToken(code);
const userInfo = await azureService.extractUserInfo(tokenResponse.idToken!);
const result = await authService.loginWithAzure(
  userInfo.azureId,
  userInfo.email,
  userInfo.name
);
// Redirige a frontend con token
```

#### Frontend - Iniciar Login

```typescript
const handleAzureLogin = async () => {
  const response = await api.get('/auth/azure');
  window.location.href = response.data.authUrl;
};
```

## Troubleshooting

### Error: "Invalid client secret"

**Problema**: El client secret expiró o es incorrecto.

**Solución**:
1. Ve a Azure Portal → App Registration → Certificates & secrets
2. Crea un nuevo client secret
3. Actualiza `AZURE_CLIENT_SECRET` en `.env`
4. Reinicia el servidor

### Error: "Redirect URI mismatch"

**Problema**: La URI de redirección no coincide con la configurada en Azure.

**Solución**:
1. Verifica que `AZURE_REDIRECT_URI` en `.env` coincida exactamente con la configurada en Azure Portal
2. Asegúrate de incluir el protocolo (`http://` o `https://`)
3. Verifica que no haya espacios o caracteres especiales

### Error: "Invalid ID token"

**Problema**: El ID token no se puede verificar.

**Solución**:
1. Verifica que `AZURE_TENANT_ID` sea correcto
2. Asegúrate de que el tenant ID en `AZURE_AUTHORITY` coincida
3. Verifica que los permisos estén correctamente configurados

### Error: "AADSTS70011: Invalid scope"

**Problema**: Los scopes solicitados no están configurados.

**Solución**:
1. Verifica que los scopes en el código sean: `['openid', 'profile', 'email']`
2. Asegúrate de que estos permisos estén agregados en Azure Portal → API permissions

### El usuario no se crea en la base de datos

**Problema**: El callback funciona pero el usuario no aparece.

**Solución**:
1. Verifica los logs del servidor para ver errores
2. Asegúrate de que la base de datos esté accesible
3. Verifica que las migraciones estén ejecutadas
4. Revisa que el email del usuario de Azure sea válido

## Seguridad

### Mejores Prácticas

1. **Nunca expongas el Client Secret**:
   - ✅ Usa variables de entorno
   - ✅ No lo commitees a Git
   - ✅ Rótalo periódicamente (cada 3-6 meses)

2. **Usa HTTPS en Producción**:
   - ✅ Configura SSL/TLS
   - ✅ Usa redirect URIs con `https://`
   - ✅ Habilita HSTS

3. **Valida Tokens**:
   - ✅ El backend ya verifica la firma del ID token
   - ✅ Valida expiración y audiencia
   - ✅ No confíes en tokens sin verificar

4. **Configura Expiración de Secrets**:
   - ✅ Usa secrets con expiración (24 meses máximo)
   - ✅ Rótalos antes de que expiren
   - ✅ Mantén un registro de secrets activos

5. **Límites de Rate Limiting**:
   - ✅ El sistema ya tiene rate limiting configurado
   - ✅ Monitorea intentos fallidos
   - ✅ Implementa bloqueos temporales si es necesario

### Checklist de Seguridad

Antes de ir a producción:

- [ ] Client Secret almacenado de forma segura (no en código)
- [ ] Redirect URIs configuradas correctamente
- [ ] HTTPS habilitado
- [ ] Permisos mínimos necesarios configurados
- [ ] Rate limiting activo
- [ ] Logs de seguridad habilitados
- [ ] Monitoreo de intentos de login configurado
- [ ] Plan de rotación de secrets establecido

## Configuración para Diferentes Ambientes

### Desarrollo

```env
AZURE_CLIENT_ID=dev-client-id
AZURE_REDIRECT_URI=http://localhost:3000/api/v1/auth/azure/callback
```

### Staging

```env
AZURE_CLIENT_ID=staging-client-id
AZURE_REDIRECT_URI=https://staging.tu-dominio.com/api/v1/auth/azure/callback
```

### Producción

```env
AZURE_CLIENT_ID=prod-client-id
AZURE_REDIRECT_URI=https://tu-dominio.com/api/v1/auth/azure/callback
```

**Recomendación**: Crea App Registrations separadas para cada ambiente.

## Recursos Adicionales

- [Documentación oficial de Azure AD](https://docs.microsoft.com/azure/active-directory/)
- [MSAL Node.js Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-node)
- [MSAL React Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-react)
- [OAuth 2.0 Flow](https://oauth.net/2/)

## Soporte

Si encuentras problemas:

1. Revisa los logs del servidor
2. Verifica la configuración en Azure Portal
3. Consulta la documentación de Azure AD
4. Revisa los issues en el repositorio del proyecto

