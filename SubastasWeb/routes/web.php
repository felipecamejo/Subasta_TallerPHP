<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\URL;

use Illuminate\Http\Request;
use App\Http\Controllers\SocialAuthController;

/*
|--------------------------------------------------------------------------
| Rutas web
|--------------------------------------------------------------------------
| Estas rutas manejan vistas o redirecciones desde enlaces como el
| de verificación de correo. No pertenecen al API.
*/

// Ruta de verificación de correo desde el enlace enviado por email

Route::get('/email/verify/{id}/{hash}', function (Request $request, $id, $hash) {
    // Buscar el usuario
    $usuario = \App\Models\Usuario::find($id);

    if (!$usuario) {
        abort(404, 'Usuario no encontrado');
    }

    // Verificamos la firma del link
    if (!URL::hasValidSignature($request)) {
        abort(401, 'Enlace inválido o expirado');
    }

    // Autenticamos temporalmente
    Auth::login($usuario);

    // Verificamos que el hash sea correcto
    if (! hash_equals((string) $hash, sha1($usuario->getEmailForVerification()))) {
        abort(403, 'Hash de verificación inválido');
    }

    // Si ya estaba verificado
    if ($usuario->hasVerifiedEmail()) {
        return redirect('http://localhost:4200/email-ya-verificado');
    }

    // Verificar el correo
    $usuario->markEmailAsVerified();

    return redirect('http://localhost:4200/email-verificado');
})->middleware(['signed'])->name('verification.verify');

// Ruta base (opcional)
Route::get('/', function () {
    return view('welcome');
});

// Test para ver variable de entorno
Route::get('/test-env', function () {
    return env('GOOGLE_CLIENT_ID');
});

// Rutas para login con Google
Route::get('/auth/redirect/google', [SocialAuthController::class, 'redirectToGoogle']);
Route::get('/auth/callback/google', [SocialAuthController::class, 'handleGoogleCallback']);
