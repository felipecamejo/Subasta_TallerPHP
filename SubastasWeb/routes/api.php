<?php
use App\Http\Controllers\PujaController;
use App\Http\Controllers\VendedorController;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

use App\Http\Controllers\CasaRemateController;
use App\Http\Controllers\SubastaController;
use App\Http\Controllers\LoteController;
use App\Http\Controllers\ArticuloController;
use App\Http\Controllers\CategoriaController;

use App\Http\Controllers\ClienteController;
use App\Http\Controllers\RematadorController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\FacturaController;
use App\Http\Controllers\MensajeController;

Route::post('/mensaje', [MensajeController::class, 'enviar']);

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


Route::post('/casa-remates/{id}/calificar', [CasaRemateController::class, 'calificar']);
// no estaba funcionando la asociacion de rematadores a casa de remate.
Route::post('casa-remates/{id}/asociar-rematadores', [CasaRemateController::class, 'asociarRematadores']);
Route::apiResource('casa-remates', CasaRemateController::class);

Route::post('/subastas/{id}/lotes', [SubastaController::class, 'agregarLotes']);
Route::apiResource('subastas', SubastaController::class);

Route::apiResource('articulos', ArticuloController::class);

Route::apiResource('lotes', LoteController::class);

Route::apiResource('categorias', CategoriaController::class);

Route::apiResource('clientes', ClienteController::class);

Route::apiResource('rematadores', RematadorController::class);


Route::apiResource('facturas', FacturaController::class);

Route::apiResource('pujas', PujaController::class);

Route::apiResource('vendedores', VendedorController::class);

