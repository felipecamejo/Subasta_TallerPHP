@echo off
echo ===============================================
echo   APLICACION DE SUBASTAS - INICIO DOCKER
echo ===============================================
echo.

echo [1/6] Deteniendo servicios previos...
docker-compose down

echo.
echo [2/6] Levantando base de datos y Redis...
docker-compose up -d db redis

echo.
echo [3/6] Esperando que los servicios base esten listos...
timeout /t 10 /nobreak > nul

echo.
echo [4/6] Levantando Laravel y Nginx...
docker-compose up -d app nginx

echo.
echo [5/6] Levantando servicios WebSocket...
docker-compose up -d websocket socket-redis

echo.
echo [6/6] Levantando Frontend y Queue...
docker-compose up -d frontend queue

echo.
echo ===============================================
echo   SERVICIOS LEVANTADOS EXITOSAMENTE
echo ===============================================
echo.
echo Frontend Angular:    http://localhost:4200
echo Backend Laravel:     http://localhost
echo WebSocket Server:    ws://localhost:3001
echo Socket Redis:        ws://localhost:3000
echo.
echo Para ver logs ejecuta: docker-compose logs -f
echo Para parar todo ejecuta: docker-compose down
echo.
pause
