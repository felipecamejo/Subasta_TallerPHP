<?php

use App\Http\Controllers\ArticuloController;
use App\Http\Controllers\CategoriaController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\LoteController; 


Route::apiResource('articulos', ArticuloController::class);

Route::apiResource('lotes', LoteController::class);

Route::apiResource('categorias', controller: CategoriaController::class);