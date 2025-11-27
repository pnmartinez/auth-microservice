#!/bin/bash

# Script para iniciar todos los servicios del sistema de autenticación

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PID_DIR="$PROJECT_DIR/.pids"
LOG_DIR="$PROJECT_DIR/logs"

# Crear directorios necesarios
mkdir -p "$PID_DIR" "$LOG_DIR"

echo "🚀 Iniciando servicios del sistema de autenticación..."
echo ""

# Función para verificar si un puerto está en uso
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0
    else
        return 1
    fi
}

# 1. Verificar/Iniciar PostgreSQL
echo "📦 Verificando PostgreSQL..."
if ! docker-compose -f "$PROJECT_DIR/docker-compose.dev.yml" ps postgres | grep -q "Up"; then
    echo "   Iniciando PostgreSQL..."
    cd "$PROJECT_DIR"
    docker-compose -f docker-compose.dev.yml up -d postgres
    sleep 3
else
    echo "   ✅ PostgreSQL ya está corriendo"
fi

# 2. Verificar migraciones
echo ""
echo "🗄️  Verificando migraciones..."
cd "$PROJECT_DIR/backend"
if [ ! -f .env ]; then
    echo "   ⚠️  Archivo .env no encontrado. Por favor configúralo primero."
    exit 1
fi

# 3. Iniciar Backend
echo ""
echo "🔧 Iniciando Backend (puerto 3000)..."
if check_port 3000; then
    echo "   ⚠️  Puerto 3000 ya está en uso"
else
    cd "$PROJECT_DIR/backend"
    npm run dev > "$LOG_DIR/backend.log" 2>&1 &
    echo $! > "$PID_DIR/backend.pid"
    echo "   ✅ Backend iniciado (PID: $(cat $PID_DIR/backend.pid))"
    sleep 3
fi

# 4. Iniciar Frontend
echo ""
echo "🎨 Iniciando Frontend (puerto 3001)..."
if check_port 3001; then
    echo "   ⚠️  Puerto 3001 ya está en uso"
else
    cd "$PROJECT_DIR/frontend"
    npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
    echo $! > "$PID_DIR/frontend.pid"
    echo "   ✅ Frontend iniciado (PID: $(cat $PID_DIR/frontend.pid))"
    sleep 2
fi

# 5. Iniciar Admin Panel
echo ""
echo "⚙️  Iniciando Admin Panel (puerto 3002)..."
if check_port 3002; then
    echo "   ⚠️  Puerto 3002 ya está en uso"
else
    cd "$PROJECT_DIR/admin-panel"
    npm run dev > "$LOG_DIR/admin.log" 2>&1 &
    echo $! > "$PID_DIR/admin.pid"
    echo "   ✅ Admin Panel iniciado (PID: $(cat $PID_DIR/admin.pid))"
    sleep 2
fi

echo ""
echo "✅ Todos los servicios iniciados!"
echo ""
echo "📍 URLs:"
echo "   - Frontend:      http://localhost:3001"
echo "   - Admin Panel:   http://localhost:3002"
echo "   - Backend API:   http://localhost:3000/api/v1"
echo "   - Health Check:  http://localhost:3000/health"
echo ""
echo "📋 Para ver logs:"
echo "   - Backend:    tail -f $LOG_DIR/backend.log"
echo "   - Frontend:   tail -f $LOG_DIR/frontend.log"
echo "   - Admin:      tail -f $LOG_DIR/admin.log"
echo ""
echo "🛑 Para detener: ./scripts/stop-all.sh"


