# Script para detener la aplicación localmente liberando los puertos en Windows

Write-Host "Buscando y deteniendo servicio Backend en puerto 8000..." -ForegroundColor Green
$backendConn = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($backendConn) {
    foreach ($conn in $backendConn) {
        Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
    }
    Write-Host "Backend detenido." -ForegroundColor Cyan
} else {
    Write-Host "No se detectó ningún proceso activo en el puerto 8000." -ForegroundColor Gray
}

Write-Host "Buscando y deteniendo servicio Frontend en puerto 5173..." -ForegroundColor Green
$frontendConn = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($frontendConn) {
    foreach ($conn in $frontendConn) {
        Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
    }
    Write-Host "Frontend detenido." -ForegroundColor Cyan
} else {
    Write-Host "No se detectó ningún proceso activo en el puerto 5173." -ForegroundColor Gray
}

Write-Host "Todos los puertos de la aplicación han sido liberados." -ForegroundColor Yellow
