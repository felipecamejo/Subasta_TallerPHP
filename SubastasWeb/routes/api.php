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
use App\Http\Controllers\PujaRedisController;
use App\Http\Controllers\VendedorController;
use App\Http\Controllers\NotificacionController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\UsuarioController;
use App\Http\Controllers\TimezoneController;
use App\Http\Controllers\PaypalController;

use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Hash;
use Illuminate\Auth\Events\PasswordReset;

Route::get('/debug-log', function () {
    Log::info(' Probando log en Laravel desde /debug-log');

    return response()->json(['mensaje' => 'Log generado. Revisa storage/logs/laravel.log']);
});

/*
Route::middleware('auth:sanctum')->get('/debug-admin', function (Request $request) {
   
    return response()->json([
        'id' => $request->user()?->id,
        'email' => $request->user()?->email,
        'rol' => $request->user()?->rol,
        'admin' => $request->user()?->admin ? true : false,
        'token' => $request->bearerToken(),
    ]);
});
*/

// Rutas públicas
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/register-casa-remate', [AuthController::class, 'registerCasaRemate']);
Route::post('/mensaje', [MensajeController::class, 'enviar']);
Route::post('/registro/google', [AuthController::class, 'loginWithGoogle']);
Route::post('/register-google-user', [AuthController::class, 'registerGoogleUser']);
Route::post('/register-google-casa-remate', [AuthController::class, 'registerGoogleCasaRemate']);
Route::post('/forgot-password', [AuthController::class, 'enviarLinkReset']);
Route::post('/reset-password', [AuthController::class, 'resetearContrasena']);
Route::post('/email/resend', [AuthController::class, 'reenviarEmailVerificacion']);

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

Route::apiResource('casa-remates', CasaRemateController::class);

// Ruta pública para obtener rematadores
Route::get('/rematadores', [RematadorController::class, 'index']);

// Ruta pública para obtener lotes
Route::get('/lotes', [LoteController::class, 'index']);

// 🛡️ Rutas protegidas por Sanctum
//Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::get('/usuario-autenticado', [AuthController::class, 'usuarioAutenticado']);
    
    Route::get('/check-auth', function () {
        return response()->json(['authenticated' => true]);
    });

    Route::post('/email/resend', function (Request $request) {
        if ($request->user()->hasVerifiedEmail()) {
            return response()->json(['message' => 'El correo ya está verificado.'], 400);
        }

        return response()->json(['message' => 'Correo de verificación reenviado.']);
    });

    Route::apiResource('subastas', SubastaController::class);
    Route::apiResource('lotes', LoteController::class)->except(['index']);
    Route::apiResource('articulos', ArticuloController::class);
    Route::apiResource('categorias', CategoriaController::class);
    Route::apiResource('clientes', ClienteController::class);
    Route::apiResource('rematadores', RematadorController::class)->except(['index']);
    Route::apiResource('facturas', FacturaController::class);
    Route::apiResource('pujas', PujaController::class);
    Route::get('/lotes/{loteId}/estadisticas', [PujaController::class, 'estadisticasLote']);
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

    // Rutas de administración SIN protección para testing
    Route::get('/admin/usuarios-pendientes', [AdminController::class, 'casasPendientes']);
    Route::post('/admin/aprobar-casa/{id}', [AdminController::class, 'aprobarCasa']);
    Route::delete('/admin/eliminar-usuario/{usuario_id}', [AdminController::class, 'eliminarUsuario']);
    Route::get('/admin/casas-activas', [AdminController::class, 'casasActivas']);
    Route::post('/admin/desaprobar-casa/{id}', [AdminController::class, 'desaprobarCasa']);
    
    // Quitar grupo admin protegido
    //Route::middleware(['auth:sanctum', 'isAdmin'])
    //->prefix('admin')
    //->group(function () {
    //    Route::get('/usuarios-pendientes', [AdminController::class, 'casasPendientes']);
    //    Route::get('/casas-activas', [AdminController::class, 'casasActivas']);
    //    Route::post('/aprobar-casa/{usuarioId}', [AdminController::class, 'aprobarCasa']);
    //    Route::post('/desaprobar-casa/{usuarioId}', [AdminController::class, 'desaprobarCasa']);
    //    Route::delete('/eliminar-usuario/{usuario_id}', [AdminController::class, 'eliminarUsuario']);
    //    Route::get('/usuarios', [AdminController::class, 'usuariosPorRol']);
    //});
    // Rutas de administración
    Route::get('/admin/usuarios-pendientes', [AdminController::class, 'casasPendientes']);
    Route::post('/admin/aprobar-casa/{id}', [AdminController::class, 'aprobarCasa']);
    Route::delete('/admin/eliminar-usuario/{usuario_id}', [AdminController::class, 'eliminarUsuario']);
    Route::get('/admin/casas-activas', [AdminController::class, 'casasActivas']);
    Route::post('/admin/desaprobar-casa/{id}', [AdminController::class, 'desaprobarCasa']);
    
    // Rutas de PayPal
    Route::post('/paypal/create-order', [PaypalController::class, 'createOrder']);
    Route::post('/paypal/capture-payment', [PaypalController::class, 'capturePayment']);
    Route::post('/paypal/webhook', [PaypalController::class, 'webhook']);
    Route::get('/paypal/success', [PaypalController::class, 'success'])->name('paypal.success');
    Route::get('/paypal/cancel', [PaypalController::class, 'cancel'])->name('paypal.cancel');
    
    // 🚀 Rutas de Pujas con Redis (Alta Concurrencia)
    Route::prefix('pujas-redis')->group(function () {
        Route::post('/{loteId}/pujar', [PujaRedisController::class, 'realizarPuja']);
        Route::get('/{loteId}/actual', [PujaRedisController::class, 'obtenerPujaActual']);
        Route::get('/{loteId}/historial', [PujaRedisController::class, 'obtenerHistorialPujas']);
        Route::get('/{loteId}/estadisticas', [PujaRedisController::class, 'obtenerEstadisticas']);
        Route::post('/{loteId}/visualizacion', [PujaRedisController::class, 'marcarVisualizacion']);
        Route::get('/debug/cliente/{usuarioId}', [PujaRedisController::class, 'debugCliente']); // 🔧 DEBUG
        Route::get('/debug-usuario/{usuarioId}', [PujaRedisController::class, 'debugUsuarioDirecto']); // 🔧 DEBUG TEMPORAL
    });

    // 🏆 Ruta para obtener ganadores de subasta
    Route::get('/subastas/{subastaId}/ganadores', [SubastaController::class, 'obtenerGanadores']);

//});

Route::get('/usuarioEmail/{id}', [\App\Http\Controllers\ClienteController::class, 'buscarUsuarioPorId']);

Route::get('notificaciones/{usuarioId}', [NotificacionController::class, 'index']);