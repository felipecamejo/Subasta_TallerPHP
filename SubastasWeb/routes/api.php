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
use App\Http\Controllers\ChatController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\TimezoneController;

use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Hash;
use Illuminate\Auth\Events\PasswordReset;

// Rutas públicas
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/register-casa-remate', [AuthController::class, 'registerCasaRemate']);
Route::post('/mensaje', [MensajeController::class, 'enviar']);

// Rutas de zona horaria
Route::get('/timezones', [TimezoneController::class, 'getTimezones']);
Route::post('/timezone/convert', [TimezoneController::class, 'convertTime']);
Route::get('/timezone/info', [TimezoneController::class, 'getTimezoneInfo']);
Route::get('/subasta/timezone/{subasta_id}', [TimezoneController::class, 'formatSubastaTime']);

// Rutas públicas para pruebas de chat
Route::post('/test-chat-invitacion', [NotificacionController::class, 'crearNotificacionChatPublico']);
Route::get('/test-notificaciones/{usuarioId}', [NotificacionController::class, 'obtenerNotificacionesPublico']);

// Rutas públicas para chat
Route::post('/chat/invitacion', [ChatController::class, 'crearInvitacion']);
Route::get('/chat/{chatId}/validar', [ChatController::class, 'validarAccesoChat']);
Route::get('/chat/{usuarioId}/activos', [ChatController::class, 'obtenerChatsActivos']);

// Rutas para mensajes de chat (públicas por ahora para pruebas)
Route::post('/chat/{chatId}/mensaje', [ChatController::class, 'enviarMensaje']);
Route::get('/chat/{chatId}/mensajes', [ChatController::class, 'obtenerMensajes']);
Route::get('/chat/{chatId}/info', [ChatController::class, 'obtenerInfoChat']);

// Rutas para valoraciones y finalización de chat
Route::post('/chat/{chatId}/valorar-usuario', [ChatController::class, 'valorarUsuario']);
Route::post('/chat/{chatId}/valorar-cliente', [ChatController::class, 'valorarUsuario']); // Compatibilidad
Route::post('/chat/{chatId}/valorar-casa', [ChatController::class, 'valorarUsuario']); // Compatibilidad
Route::post('/chat/{chatId}/finalizar-chat', [ChatController::class, 'finalizarChat']);
Route::get('/chat/{chatId}/estado', [ChatController::class, 'verificarEstadoChat']);

Route::apiResource('subastas', SubastaController::class);
Route::apiResource('casa-remates', CasaRemateController::class);

// 🛡️ Rutas protegidas por Sanctum
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::get('/check-auth', function () {
        return response()->json(['authenticated' => true]);
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

    // Rutas de administración
    Route::get('/admin/usuarios-pendientes', [AdminController::class, 'casasPendientes']);
    Route::post('/admin/aprobar-casa/{id}', [AdminController::class, 'aprobarCasa']);
    Route::delete('/admin/eliminar-usuario/{usuario_id}', [AdminController::class, 'eliminarUsuario']);
    Route::get('/admin/casas-activas', [AdminController::class, 'casasActivas']);
    Route::post('/admin/desaprobar-casa/{id}', [AdminController::class, 'desaprobarCasa']);
});
