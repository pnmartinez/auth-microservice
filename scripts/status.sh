#!/bin/bash

# Script para verificar el estado de todos los servicios

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PID_DIR="$PROJECT_DIR/.pids"

echo "📊 Estado de los Servicios"
echo "=========================="
echo ""

# Función para verificar puerto
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0
    else
        return 1
    fi
}

# Función para verificar proceso
check_process() {
    local service=$1
    local pid_file="$PID_DIR/$service.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0
        else
            return 1
        fi
    else
        return 1
    fi
}

# PostgreSQL
echo "1. PostgreSQL (puerto 5432):"
if docker-compose -f "$PROJECT_DIR/docker-compose.dev.yml" ps postgres | grep -q "Up"; then
    echo "   ✅ Running"
    docker-compose -f "$PROJECT_DIR/docker-compose.dev.yml" ps postgres | grep postgres
else
    echo "   ❌ Stopped"
fi
echo ""

# Backend
echo "2. Backend API (puerto 3000):"
if check_port 3000; then
    if check_process "backend"; then
        PID=$(cat "$PID_DIR/backend.pid")
        echo "   ✅ Running (PID: $PID)"
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health 2>/dev/null || echo "000")
        if [ "$HTTP_CODE" = "200" ]; then
            echo "   ✅ Health check: OK"
        else
            echo "   ⚠️  Health check: Failed (HTTP $HTTP_CODE)"
        fi
    else
        echo "   ⚠️  Puerto en uso pero proceso no encontrado"
    fi
else
    echo "   ❌ Not running"
fi
echo ""

# Frontend
echo "3. Frontend (puerto 3001):"
if check_port 3001; then
    if check_process "frontend"; then
        PID=$(cat "$PID_DIR/frontend.pid")
        echo "   ✅ Running (PID: $PID)"
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 2>/dev/null || echo "000")
        if [ "$HTTP_CODE" = "200" ]; then
            echo "   ✅ Responding"
        else
            echo "   ⚠️  Not responding (HTTP $HTTP_CODE)"
        fi
    else
        echo "   ⚠️  Puerto en uso pero proceso no encontrado"
    fi
else
    echo "   ❌ Not running"
fi
echo ""

# Admin Panel
echo "4. Admin Panel (puerto 3002):"
if check_port 3002; then
    if check_process "admin"; then
        PID=$(cat "$PID_DIR/admin.pid")
        echo "   ✅ Running (PID: $PID)"
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002 2>/dev/null || echo "000")
        if [ "$HTTP_CODE" = "200" ]; then
            echo "   ✅ Responding"
        else
            echo "   ⚠️  Not responding (HTTP $HTTP_CODE)"
        fi
    else
        echo "   ⚠️  Puerto en uso pero proceso no encontrado"
    fi
else
    echo "   ❌ Not running"
fi
echo ""

# Base de datos
echo "5. Base de Datos:"
if docker-compose -f "$PROJECT_DIR/docker-compose.dev.yml" ps postgres | grep -q "Up"; then
    USER_COUNT=$(psql postgresql://postgres:postgres@localhost:5432/auth_db -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | xargs || echo "?")
    TABLE_COUNT=$(psql postgresql://postgres:postgres@localhost:5432/auth_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs || echo "?")
    echo "   ✅ Conectada"
    echo "   📊 Usuarios: $USER_COUNT"
    echo "   📊 Tablas: $TABLE_COUNT"
else
    echo "   ❌ No conectada"
fi
echo ""

echo "=========================="


