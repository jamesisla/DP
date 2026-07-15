# Script para iniciar la aplicación localmente en Windows

Write-Host "Iniciando backend FastAPI..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8000"

Write-Host "Iniciando frontend React (Vite)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "Iniciado con éxito en procesos independientes." -ForegroundColor Cyan
Write-Host "Acceso Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host "Acceso API/Docs: http://localhost:8000/docs" -ForegroundColor Yellow
