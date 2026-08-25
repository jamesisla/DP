#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

echo "🚀 Iniciando LexApp GRC (Go Core + React Vite)..."

# 1. Backend Go
echo "📦 Iniciando Backend Go en puerto 8000..."
if [ ! -f "$DIR/lexapp-server" ]; then
    go build -o lexapp-server main.go
fi
./lexapp-server &
BACKEND_PID=$!

# 2. Frontend React (Vite)
echo "💻 Iniciando Frontend React (Vite) en puerto 5173..."
cd "$DIR/frontend"
npm run dev &
FRONTEND_PID=$!

cleanup() {
    echo ""
    echo "🛑 Deteniendo servicios..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    wait $BACKEND_PID 2>/dev/null || true
    wait $FRONTEND_PID 2>/dev/null || true
    echo "✨ Servicios detenidos limpiamente."
}
trap cleanup SIGINT SIGTERM EXIT

echo ""
echo "✅ LexApp GRC (Go Stack) corriendo en:"
echo "   - Frontend: http://localhost:5173"
echo "   - Backend Go API: http://localhost:8000"
echo ""

wait
