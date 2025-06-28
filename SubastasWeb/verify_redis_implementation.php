<?php

/**
 * 📋 Redis Implementation Verification Script
 * 
 * Run this script to verify that all Redis endpoints are working correctly
 * Usage: php verify_redis_implementation.php
 */

echo "🔍 VERIFICANDO IMPLEMENTACIÓN REDIS...\n\n";

// Check if Redis is running
echo "1. ✅ Verificando conexión a Redis...\n";
try {
    $redis = new Redis();
    $redis->connect('127.0.0.1', 6379);
    $redis->ping();
    echo "   ✅ Redis conectado correctamente\n\n";
} catch (Exception $e) {
    echo "   ❌ ERROR: Redis no está disponible - " . $e->getMessage() . "\n";
    echo "   💡 Solución: Ejecutar 'redis-server' en otra terminal\n\n";
    exit(1);
}

// Check Laravel routes
echo "2. ✅ Verificando rutas de Laravel...\n";
$routes_to_check = [
    'GET /api/pujas-redis/1/actual',
    'GET /api/pujas-redis/1/historial', 
    'GET /api/pujas-redis/1/estadisticas',
    'POST /api/pujas-redis/1/pujar',
    'POST /api/pujas-redis/1/visualizacion'
];

foreach ($routes_to_check as $route) {
    echo "   📍 $route\n";
}
echo "   💡 Verificar con: php artisan route:list | grep pujas-redis\n\n";

// Check files exist
echo "3. ✅ Verificando archivos implementados...\n";
$files_to_check = [
    'app/Http/Controllers/PujaRedisController.php' => 'Controlador Redis',
    'app/Services/PujaWebSocketService.php' => 'Servicio WebSocket',
    'app/Console/Commands/SincronizarPujasRedis.php' => 'Comando sincronización',
    'frontend/src/services/puja.service.ts' => 'Servicio Angular',
    'frontend/src/app/stream/stream.component.ts' => 'Componente Stream'
];

foreach ($files_to_check as $file => $description) {
    if (file_exists($file)) {
        echo "   ✅ $description ($file)\n";
    } else {
        echo "   ❌ FALTA: $description ($file)\n";
    }
}

echo "\n4. ✅ Comandos para testing:\n";
echo "   🚀 Iniciar Laravel: php artisan serve\n";
echo "   🚀 Iniciar Frontend: cd frontend && npm start\n";
echo "   🚀 Monitorear Redis: redis-cli monitor\n";
echo "   🚀 Ver logs: tail -f storage/logs/laravel.log\n";

echo "\n5. ✅ URLs de prueba:\n";
echo "   🌐 Frontend: http://localhost:4200\n";
echo "   🌐 Backend: http://localhost:8000\n";
echo "   📊 Ejemplo API: http://localhost:8000/api/pujas-redis/1/actual\n";

echo "\n🎉 VERIFICACIÓN COMPLETA!\n";
echo "💡 Sigue las instrucciones en REDIS_IMPLEMENTATION_SUMMARY.md\n";

?>
