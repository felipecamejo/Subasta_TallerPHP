<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class UsuarioController extends Controller
{
    public function autenticado(Request $request)
    {
        $usuario = $request->user();

        $rol = match (true) {
            $usuario->cliente !== null => 'cliente',
            $usuario->rematador !== null => 'rematador',
            $usuario->casaRemate !== null => 'casaremate',
            $usuario->admin !== null => 'admin',
            default => 'desconocido',
        };

        return response()->json([
            'id' => $usuario->id,
            'nombre' => $usuario->nombre,
            'email' => $usuario->email,
            'rol' => $rol,
        ]);
    }
}
