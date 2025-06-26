<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class IsAdmin
{
    public function handle(Request $request, Closure $next)
    {
        $usuario = $request->user();

        // Verifica si existe la relación con el modelo Admin
        if (!$usuario || !$usuario->admin()->exists()) {
            return response()->json(['message' => 'Acceso denegado. Solo administradores.'], 403);
        }

        return $next($request);
    }
}