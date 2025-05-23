<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Events\MensajeEnviado;

class MensajeController extends Controller
{
    public function enviar(Request $request)
    {
        $mensaje = $request->input('mensaje', 'Hola desde Laravel');

        // Dispara el evento
        event(new MensajeEnviado($mensaje));

        return response()->json([
            'status' => 'Mensaje emitido',
            'mensaje' => $mensaje
        ]);
    }
}
