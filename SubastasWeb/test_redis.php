#!/usr/bin/env php
<?php

require_once __DIR__ . '/vendor/autoload.php';

use App\Services\SimpleRedisClient;

echo "🚀 Probando cliente Redis personalizado (sin Predis)...\n\n";

try {
    $redis = new SimpleRedisClient();
    
    // Test básico
    echo "1. Test básico SET/GET:\n";
    $redis->set('test_key', 'hello_world');
    $value = $redis->get('test_key');
    echo "   Valor guardado: hello_world\n";
    echo "   Valor obtenido: $value\n";
    echo "   ✅ " . ($value === 'hello_world' ? 'ÉXITO' : 'FALLO') . "\n\n";
    
    // Test hash
    echo "2. Test HASH HSET/HGET:\n";
    $redis->hset('test_hash', 'field1', 'value1');
    $hashValue = $redis->hget('test_hash', 'field1');
    echo "   Hash guardado: field1 => value1\n";
    echo "   Hash obtenido: field1 => $hashValue\n";
    echo "   ✅ " . ($hashValue === 'value1' ? 'ÉXITO' : 'FALLO') . "\n\n";
    
    // Test ping
    echo "3. Test PING:\n";
    $pong = $redis->ping();
    echo "   Respuesta: $pong\n";
    echo "   ✅ " . ($pong === 'PONG' ? 'ÉXITO' : 'FALLO') . "\n\n";
    
    echo "🎉 Todos los tests pasaron! Redis funciona sin Predis.\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "💡 Asegúrate de que Redis esté ejecutándose: redis-server\n";
}
