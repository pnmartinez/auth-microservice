#!/bin/bash

# Script para reiniciar todos los servicios

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔄 Reiniciando servicios..."
echo ""

"$SCRIPT_DIR/stop-all.sh"
sleep 2
"$SCRIPT_DIR/start-all.sh"

echo ""
echo "✅ Reinicio completado"


