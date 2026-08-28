#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

echo "🏗️ Compilando Frontend React LexApp DP..."
(cd "$DIR/frontend" && npm install && npm run build)

echo "🔨 Compilando binario Go nativo LexApp..."
mkdir -p "$DIR/bin"
go build -ldflags="-s -w" -o "$DIR/bin/lexapp-dp" main.go

echo "✅ Binario generado exitosamente: ./bin/lexapp-dp"
