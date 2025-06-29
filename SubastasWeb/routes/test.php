<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Redis;
use Illuminate\Http\Request;

Route::get('/test-redis', function () {
    try {
        // Test básico de conexión sin usar Predis
        Redis::set('test_key', 'hello_world');
        $value = Redis::get('test_key');
        
        return response()->json([
            'status' => 'success',
            'message' => 'Redis working with phpredis',
            'value' => $value,
            'client_type' => config('database.redis.client')
        ]);
        
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => $e->getMessage(),
            'client_type' => config('database.redis.client')
        ], 500);
    }
});

Route::get('/test-db', function () {
    try {
        $result = \DB::select('SELECT 1 as test');
        return response()->json([
            'status' => 'success',
            'message' => 'Database connection working',
            'result' => $result
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => $e->getMessage()
        ], 500);
    }
});
