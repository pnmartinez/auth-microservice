#!/bin/bash

# Script para detener todos los servicios del sistema de autenticación

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PID_DIR="$PROJECT_DIR/.pids"

echo "🛑 Deteniendo servicios..."

# Función para detener proceso por PID o por puerto/comando
stop_service() {
    local service=$1
    local port=$2
    local pid_file="$PID_DIR/$service.pid"
    local found=false
    
    # Intentar detener por PID file
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            echo "   Deteniendo $service (PID: $pid)..."
            kill "$pid" 2>/dev/null || true
            sleep 1
            if ps -p "$pid" > /dev/null 2>&1; then
                kill -9 "$pid" 2>/dev/null || true
            fi
            rm -f "$pid_file"
            echo "   ✅ $service detenido"
            found=true
        else
            rm -f "$pid_file"
        fi
    fi
    
    # Si no se encontró por PID, buscar por puerto
    if [ "$found" = false ] && [ -n "$port" ]; then
        local pid_by_port=$(lsof -ti :$port 2>/dev/null || true)
        if [ -n "$pid_by_port" ]; then
            echo "   Deteniendo $service en puerto $port (PID: $pid_by_port)..."
            kill $pid_by_port 2>/dev/null || true
            sleep 1
            if ps -p $pid_by_port > /dev/null 2>&1; then
                kill -9 $pid_by_port 2>/dev/null || true
            fi
            echo "   ✅ $service detenido"
            found=true
        fi
    fi
    
    # Si aún no se encontró, buscar por patrón de comando
    if [ "$found" = false ]; then
        case $service in
            backend)
                local pids=$(pgrep -f "tsx.*app\.ts" 2>/dev/null || true)
                ;;
            frontend)
                local pids=$(pgrep -f "vite.*frontend" 2>/dev/null || true)
                ;;
            admin)
                local pids=$(pgrep -f "vite.*admin-panel" 2>/dev/null || true)
                ;;
        esac
        
        if [ -n "$pids" ]; then
            echo "   Deteniendo $service (PIDs: $pids)..."
            kill $pids 2>/dev/null || true
            sleep 1
            for pid in $pids; do
                if ps -p $pid > /dev/null 2>&1; then
                    kill -9 $pid 2>/dev/null || true
                fi
            done
            echo "   ✅ $service detenido"
            found=true
        fi
    fi
    
    if [ "$found" = false ]; then
        echo "   ⚠️  $service no está corriendo"
    fi
}

# Detener servicios
stop_service "backend" "3000"
stop_service "frontend" "3001"
stop_service "admin" "3002"

# Opcional: Detener PostgreSQL (comentado por defecto)
# echo ""
# echo "¿Detener PostgreSQL también? (y/N)"
# read -r response
# if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
#     cd "$PROJECT_DIR"
#     docker-compose -f docker-compose.dev.yml stop postgres
#     echo "   ✅ PostgreSQL detenido"
# fi

echo ""
echo "✅ Servicios detenidos"

