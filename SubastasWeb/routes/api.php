<?php
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

use App\Http\Controllers\ArticuloController;
use App\Http\Controllers\CategoriaController;
use App\Http\Controllers\LoteController;
use App\Http\Controllers\ClienteController;
use App\Http\Controllers\RematadorController;
use App\Http\Controllers\AuthController;

// Ruta pública para login
Route::post('/login', [AuthController::class, 'login']);

// Rutas protegidas por Sanctum
Route::middleware('auth:sanctum')->group(function () {
    // Ruta para cerrar sesión
    Route::post('/logout', [AuthController::class, 'logout']);

    // Rutas protegidas (requieren token válido)
    Route::apiResource('lotes', LoteController::class);
    Route::apiResource('articulos', ArticuloController::class);
    Route::apiResource('categorias', CategoriaController::class);
    Route::apiResource('clientes', ClienteController::class);
    Route::apiResource('rematadores', RematadorController::class);

    // Ruta para obtener el usuario autenticado
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::apiResource('lotes', LoteController::class);

Route::apiResource('articulos', ArticuloController::class);

Route::apiResource('categorias', controller: CategoriaController::class);