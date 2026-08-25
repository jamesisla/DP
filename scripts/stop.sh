#!/usr/bin/env bash
echo "🛑 Liberando puertos 8000 y 5173..."
fuser -k 8000/tcp 2>/dev/null || true
fuser -k 5173/tcp 2>/dev/null || true
echo "✨ Puertos liberados."
