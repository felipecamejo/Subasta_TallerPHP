<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Usuario;
use App\Models\Cliente;
use App\Models\Rematador;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Google_Client;

class LoginWithGoogleController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
            'rol' => 'required|in:cliente,rematador',
            'matricula' => 'required_if:rol,rematador|nullable|string|unique:rematadores,matricula',
        ]);

        $client = new Google_Client(['client_id' => env('GOOGLE_CLIENT_ID')]);

        try {
            $payload = $client->verifyIdToken($request->token);

            if (!$payload) {
                return response()->json(['message' => 'Token inválido'], 401);
            }

            $email = $payload['email'];
            $nombre = $payload['name'];
            $avatar = $payload['picture'];

            $usuario = Usuario::firstWhere('email', $email);

            if (!$usuario) {
                // Usuario nuevo: completar datos
                $usuario = Usuario::create([
                    'nombre' => $nombre,
                    'email' => $email,
                    'cedula' => '',
                    'telefono' => '',
                    'imagen' => $avatar,
                    'contrasenia' => bcrypt(Str::random(16)),
                ]);

                if ($request->rol === 'rematador') {
                    Rematador::create([
                        'usuario_id' => $usuario->id,
                        'matricula' => $request->matricula,
                    ]);
                } else {
                    Cliente::create([
                        'usuario_id' => $usuario->id,
                    ]);
                }
            }

            $token = $usuario->createToken('auth_token')->plainTextToken;

            $usuario->load(['rematador', 'cliente']);
            $rol = $usuario->rematador ? 'rematador' : 'cliente';

            return response()->json([
                'access_token' => $token,
                'token_type' => 'Bearer',
                'usuario_id' => $usuario->id,
                'rol' => $rol,
                'usuario' => $usuario,
            ]);

        } catch (\Throwable $e) {
            Log::error('Error al verificar token de Google: ' . $e->getMessage());
            return response()->json(['message' => 'Error al procesar login con Google'], 500);
        }
    }
}
