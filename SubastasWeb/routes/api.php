<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CasaRemateController;
use App\Http\Controllers\SubastaController;
use App\Http\Controllers\LoteController;
use App\Http\Controllers\ArticuloController;
use App\Http\Controllers\CategoriaController;
use App\Http\Controllers\FacturaController;
use App\Http\Controllers\PujaController;
use App\Http\Controllers\VendedorController;

Route::apiResource('casaremates', CasaRemateController::class);

Route::apiResource('subasta', SubastaController::class);

Route::apiResource('articulos', ArticuloController::class);

Route::apiResource('lotes', LoteController::class);

Route::apiResource('categorias', CategoriaController::class);

Route::apiResource('facturas', FacturaController::class);

Route::apiResource('vendedores', VendedorController::class);

Route::apiResource('pujas', PujaController::class);