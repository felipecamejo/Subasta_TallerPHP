<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CasaRemateController;
use App\Http\Controllers\SubastaController;
use App\Http\Controllers\LoteController;
use App\Http\Controllers\ArticuloController;
use App\Http\Controllers\CategoriaController;
use App\Http\Controllers\MensajeController;

Route::post('/mensaje', [MensajeController::class, 'enviar']);

//Route::apiResource('casaremates', CasaRemateController::class);

//Route::apiResource('subasta', SubastaController::class);

Route::apiResource('articulos', ArticuloController::class);

Route::apiResource('lotes', LoteController::class);

Route::apiResource('categorias', CategoriaController::class);
