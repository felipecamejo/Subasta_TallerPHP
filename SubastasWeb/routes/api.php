<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CasaRemateController;
use App\Http\Controllers\SubastaController;
use App\Http\Controllers\LoteController;
use App\Http\Controllers\ArticuloController;
use App\Http\Controllers\CategoriaController;

// no estaba funcionando la asociacion de rematadores a casa de remate.
Route::post('casa-remates/{id}/asociar-rematadores', [CasaRemateController::class, 'asociarRematadores']);
Route::apiResource('casa-remates', CasaRemateController::class);

Route::apiResource('subastas', SubastaController::class);

Route::apiResource('articulos', ArticuloController::class);

Route::apiResource('lotes', LoteController::class);

Route::apiResource('categorias', CategoriaController::class);
