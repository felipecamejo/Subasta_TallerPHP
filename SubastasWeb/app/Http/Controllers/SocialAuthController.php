<?php

namespace App\Http\Controllers;

use Laravel\Socialite\Facades\Socialite;
use Illuminate\Http\Request;
use App\Models\Usuario;
use App\Models\Cliente;
use App\Models\Rematador;
use Illuminate\Support\Facades\Hash;
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
    $request->validate([
        'token' => 'required|string',
        'rol' => 'required|in:cliente,rematador',
        'matricula' => 'required_if:rol,rematador|nullable|string|unique:rematadores,matricula',
    ]);

    $googleUser = Socialite::driver('google')->stateless()->userFromToken($request->token);

    $usuario = Usuario::firstWhere('email', $googleUser->getEmail());

    if (!$usuario) {
        // Usuario nuevo
        $usuario = Usuario::create([
            'nombre' => $googleUser->getName(),
            'email' => $googleUser->getEmail(),
            'cedula' => '', // Adaptá según tu lógica
            'telefono' => '',
            'imagen' => $googleUser->getAvatar(),
            'contrasenia' => bcrypt(Str::random(16)),
        ]);

        if ($request->rol === 'rematador') {
            Rematador::create([
                'usuario_id' => $usuario->id,
                'matricula' => $request->matricula,
            ]);
        } else if ($request->rol === 'cliente') {
            Cliente::create([
                'usuario_id' => $usuario->id,
            ]);
        }
    }

    $token = $usuario->createToken('auth_token')->plainTextToken;

    return response()->json([
        'access_token' => $token,
        'token_type' => 'Bearer',
        'usuario' => $usuario->load(['rematador', 'cliente']),
    ]);
}

}