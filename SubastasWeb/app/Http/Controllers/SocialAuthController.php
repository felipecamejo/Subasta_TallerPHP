<?php

namespace App\Http\Controllers;

use Laravel\Socialite\Facades\Socialite;
use Illuminate\Http\Request;
use App\Models\Usuario;
use App\Models\Cliente;
use App\Models\Rematador;
use Illuminate\Support\Facades\Hash;
use Exception;
use Google\Client as GoogleClient;
use Illuminate\Support\Str;

class SocialAuthController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/auth/redirect/google",
     *     tags={"Autenticación Social"},
     *     summary="Redirigir a Google para iniciar sesión",
     *     description="Esta ruta redirige al usuario a Google para el inicio de sesión.",
     *     operationId="redirectToGoogle",
     *     @OA\Parameter(
     *         name="rol",
     *         in="query",
     *         required=true,
     *         description="Rol del usuario: cliente o rematador",
     *         @OA\Schema(type="string", enum={"cliente", "rematador"})
     *     ),
     *     @OA\Response(
     *         response=302,
     *         description="Redirección a Google"
     *     )
     * )
     */
    public function redirectToGoogle(Request $request)
    {
        $rol = $request->query('rol');

        if (!in_array($rol, ['cliente', 'rematador'])) {
            return response()->json(['error' => 'Rol inválido'], 400);
        }

        // Guardar rol en sesión para usar después en el callback
        session(['rol' => $rol]);

        return Socialite::driver('google')->stateless()->redirect();
    }

    /**
     * @OA\Get(
     *     path="/api/auth/callback/google",
     *     tags={"Autenticación Social"},
     *     summary="Callback de Google después del login",
     *     description="Procesa el usuario de Google y lo registra como cliente o rematador",
     *     operationId="handleGoogleCallback",
     *     @OA\Response(
     *         response=200,
     *         description="Usuario autenticado y rol asignado",
     *         @OA\JsonContent(
     *             @OA\Property(property="token", type="string"),
     *             @OA\Property(property="rol", type="string")
     *         )
     *     )
     * )
     */
    public function handleGoogleCallback(Request $request)
    {
        $rol = session('rol');

        if (!in_array($rol, ['cliente', 'rematador'])) {
            return response()->json(['error' => 'Rol inválido'], 400);
        }

        $googleUser = Socialite::driver('google')->stateless()->user();

        // Crear usuario si no existe
        $usuario = Usuario::firstOrCreate(
            ['email' => $googleUser->getEmail()],
            [
                'nombre' => $googleUser->getName(),
                'cedula' => '00000000',
                'telefono' => '00000000',
                'imagen' => $googleUser->getAvatar(),
                'contrasenia' => Hash::make(uniqid()),
                'latitud' => 0,
                'longitud' => 0
            ]
        );

        // Asignar rol si aún no lo tiene
        if ($rol === 'cliente' && !$usuario->cliente) {
            Cliente::create([
                'usuario_id' => $usuario->id,
                'calificacion' => 5,
            ]);
        }

        if ($rol === 'rematador' && !$usuario->rematador) {
            Rematador::create([
                'usuario_id' => $usuario->id,
                'matricula' => 'GOOGLE-' . strtoupper(substr($usuario->nombre, 0, 3)) . rand(1000, 9999),
            ]);
        }

        // Generar token Sanctum
        $token = $usuario->createToken('token-google')->plainTextToken;

        // Opcional: limpiar el rol de la sesión
        session()->forget('rol');

        return response()->json([
            'token' => $token,
            'rol' => $rol,
        ]);
    }
public function loginWithGoogle(Request $request)
    {
        try {
            $request->validate([
                'token' => 'required|string',
            ]);

            // 1) Instanciamos Google_Client con el CLIENT_ID que definiste en .env
            $googleClient = new GoogleClient([
                'client_id' => config('services.google.client_id'),
            ]);

            // 2) Verificamos y decodificamos el ID-token JWT que envía el frontend
            $payload = $googleClient->verifyIdToken($request->token);

            if (! $payload) {
                // Si no es válido o está expirado, devolvemos 401
                return response()->json(['error' => 'Token de Google inválido'], 401);
            }

            // 3) Extraemos los datos que necesitamos del payload
            $email  = $payload['email'];
            $nombre = $payload['name'];
            $imagen = $payload['picture'] ?? '';

            // 4) Buscamos si ya existe un usuario con ese email
            $usuario = Usuario::firstWhere('email', $email);

            if ($usuario) {
                // 5a) Usuario ya registrado: generamos token Sanctum y devolvemos datos
                $token = $usuario->createToken('auth_token')->plainTextToken;
                $rol   = $usuario->rematador ? 'rematador' : 'cliente';

                return response()->json([
                    'registrado'   => true,
                    'access_token' => $token,
                    'usuario_id'   => $usuario->id,
                    'rol'          => $rol,
                    'usuario'      => $usuario->makeHidden(['contrasenia']),
                ]);
            }

            // 5b) Usuario NO existe: devolvemos los datos para prellenar el formulario
            return response()->json([
                'registrado' => false,
                'nombre'     => $nombre,
                'email'      => $email,
                'imagen'     => $imagen,
            ]);

        } catch (Exception $e) {
            // En desarrollo, devolvemos la excepción en JSON para depurar
            return response()->json([
                'error'   => 'Excepción en loginWithGoogle',
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ], 500);
        }
    }

}