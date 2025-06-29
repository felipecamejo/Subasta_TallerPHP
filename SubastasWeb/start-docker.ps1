Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   APLICACION DE SUBASTAS - INICIO DOCKER" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host

Write-Host "[1/6] Deteniendo servicios previos..." -ForegroundColor Yellow
docker-compose down

Write-Host
Write-Host "[2/6] Levantando base de datos y Redis..." -ForegroundColor Yellow
docker-compose up -d db redis

Write-Host
Write-Host "[3/6] Esperando que los servicios base estén listos..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host
Write-Host "[4/6] Levantando Laravel y Nginx..." -ForegroundColor Yellow  
docker-compose up -d app nginx

Write-Host
Write-Host "[5/6] Levantando servicios WebSocket..." -ForegroundColor Yellow
docker-compose up -d websocket socket-redis

Write-Host
Write-Host "[6/6] Levantando Frontend y Queue..." -ForegroundColor Yellow
docker-compose up -d frontend queue

Write-Host
Write-Host "===============================================" -ForegroundColor Green
Write-Host "   SERVICIOS LEVANTADOS EXITOSAMENTE" -ForegroundColor Green  
Write-Host "===============================================" -ForegroundColor Green
Write-Host
Write-Host "Frontend Angular:    " -NoNewline -ForegroundColor White
Write-Host "http://localhost:4200" -ForegroundColor Cyan
Write-Host "Backend Laravel:     " -NoNewline -ForegroundColor White  
Write-Host "http://localhost" -ForegroundColor Cyan
Write-Host "WebSocket Server:    " -NoNewline -ForegroundColor White
Write-Host "ws://localhost:3001" -ForegroundColor Cyan
Write-Host "Socket Redis:        " -NoNewline -ForegroundColor White
Write-Host "ws://localhost:3000" -ForegroundColor Cyan
Write-Host

Write-Host "Para ver logs ejecuta: " -NoNewline -ForegroundColor White
Write-Host "docker-compose logs -f" -ForegroundColor Yellow
Write-Host "Para parar todo ejecuta: " -NoNewline -ForegroundColor White
Write-Host "docker-compose down" -ForegroundColor Yellow
Write-Host

Write-Host "Presiona cualquier tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
