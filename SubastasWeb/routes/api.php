<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CasaRemateController;
use App\Http\Controllers\DtoDireccionController;
use App\Http\Controllers\SubastaController;

Route::apiResource('casaremates', CasaRemateController::class);
Route::apiResource('subasta', SubastaController::class);
Route::apiResource('dtodireccion', DtoDireccionController::class);
//Route::apiResource('lotes', LoteController::class);
?>
