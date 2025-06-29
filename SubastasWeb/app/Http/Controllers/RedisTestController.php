<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Log;

class RedisTestController extends Controller
{
    public function testRedis()
    {
        try {
            // Test básico de conexión
            Redis::set('test_key', 'test_value');
            $value = Redis::get('test_key');
            
            // Test de operaciones básicas
            Redis::hset('test_hash', 'field1', 'value1');
            $hashValue = Redis::hget('test_hash', 'field1');
            
            return response()->json([
                'status' => 'success',
                'message' => 'Redis connection working',
                'test_value' => $value,
                'hash_value' => $hashValue,
                'redis_client' => config('database.redis.default.client')
            ]);
            
        } catch (\Exception $e) {
            Log::error('Redis test error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
                'redis_client' => config('database.redis.default.client')
            ], 500);
        }
    }
}
