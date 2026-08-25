#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

echo "🚀 Iniciando LexApp GRC en entorno local..."

# 1. Backend
echo "📦 Iniciando Backend (FastAPI)..."
cd "$DIR/backend"
if [ -d "venv" ]; then
    source venv/bin/activate
elif [ -d ".venv" ]; then
    source .venv/bin/activate
fi
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!

# 2. Frontend
echo "💻 Iniciando Frontend (Vite)..."
cd "$DIR/frontend"
npm run dev &
FRONTEND_PID=$!

# Trap para matar ambos al salir con Ctrl+C
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
echo "✅ LexApp corriendo localmente:"
echo "   - Frontend: http://localhost:5173"
echo "   - Backend API: http://localhost:8000/docs"
echo "   (Presiona Ctrl+C para detener ambos)"
echo ""

wait
