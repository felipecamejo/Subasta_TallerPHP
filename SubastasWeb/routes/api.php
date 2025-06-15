<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\MensajeController;
use App\Http\Controllers\CasaRemateController;
use App\Http\Controllers\SubastaController;
use App\Http\Controllers\LoteController;
use App\Http\Controllers\ArticuloController;
use App\Http\Controllers\CategoriaController;
use App\Http\Controllers\ClienteController;
use App\Http\Controllers\RematadorController;
use App\Http\Controllers\FacturaController;
use App\Http\Controllers\PujaController;
use App\Http\Controllers\VendedorController;
use App\Http\Controllers\NotificacionController;

use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Hash;
use Illuminate\Auth\Events\PasswordReset;

// Rutas públicas
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/mensaje', [MensajeController::class, 'enviar']);
Route::post('/registro/google', [AuthController::class, 'loginWithGoogle']);
Route::post('/register-google-user', [AuthController::class, 'registerGoogleUser']);
Route::post('/forgot-password', [AuthController::class, 'enviarLinkReset']);
Route::post('/reset-password', [AuthController::class, 'resetearContrasena']);

Route::apiResource('subastas', SubastaController::class);

// 🛡️ Rutas protegidas por Sanctum
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::post('/email/resend', function (Request $request) {
        if ($request->user()->hasVerifiedEmail()) {
            return response()->json(['message' => 'El correo ya está verificado.'], 400);
        }

        return response()->json(['message' => 'Correo de verificación reenviado.']);
    });

    Route::apiResource('lotes', LoteController::class);
    Route::apiResource('articulos', ArticuloController::class);
    Route::apiResource('categorias', CategoriaController::class);
    Route::apiResource('clientes', ClienteController::class);
    Route::apiResource('rematadores', RematadorController::class);
    Route::apiResource('facturas', FacturaController::class);
    Route::apiResource('pujas', PujaController::class);
    Route::apiResource('vendedores', VendedorController::class);
    Route::apiResource('casa-remates', CasaRemateController::class);

    // Rutas de notificaciones
    Route::get('/notificaciones', [NotificacionController::class, 'index']);
    Route::post('/notificaciones', [NotificacionController::class, 'store']);
    Route::put('/notificaciones/{id}/leer', [NotificacionController::class, 'marcarLeida']);
    Route::put('/notificaciones/leer-todas', [NotificacionController::class, 'marcarTodasLeidas']);

    // Rutas de casas de remate y subastas
    Route::post('/casa-remates/{id}/calificar', [CasaRemateController::class, 'calificar']);
    Route::post('/casa-remates/{id}/asociar-rematadores', [CasaRemateController::class, 'asociarRematadores']);
    Route::post('/subastas/{id}/lotes', [SubastaController::class, 'agregarLotes']);
    Route::post('/subastas/enviarMail', [SubastaController::class, 'enviarEmailNotificacion']);
});
