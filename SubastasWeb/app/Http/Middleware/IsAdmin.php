<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class IsAdmin
{
    public function handle(Request $request, Closure $next)
    {
        $usuario = $request->user();

        if (!$usuario || $usuario->rol !== 'admin') {
            abort(403, 'Acceso denegado. Solo administradores.');
        }

        return $next($request);
    }
}
