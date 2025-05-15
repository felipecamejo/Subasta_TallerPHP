<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PujaController;
use App\Http\Controllers\FacturaController;
use App\Http\Controllers\VendedorController;

// Ruta básica para verificar si la API responde
Route::get('/ping', function () {
    return response()->json(['message' => 'API funcionando correctamente']);
});

// Rutas API para PUJAS
Route::apiResource('pujas', PujaController::class);

// Rutas API para FACTURAS
Route::apiResource('facturas', FacturaController::class);

// Rutas API para VENDEDORES
Route::apiResource('vededeores', VendedorController::class);

