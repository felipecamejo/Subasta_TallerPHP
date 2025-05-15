<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CasaRemateController;
use App\Http\Controllers\SubastaController;
use App\Http\Controllers\LoteController;

Route::apiResource('casaremates', CasaRemateController::class);
Route::apiResource('subasta', SubastaController::class);
Route::apiResource('lotes', LoteController::class);

?>
