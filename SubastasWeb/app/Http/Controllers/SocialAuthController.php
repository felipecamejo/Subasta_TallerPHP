<?php

namespace App\Http\Controllers;

use Laravel\Socialite\Facades\Socialite;
use App\Models\Usuario;
use Illuminate\Support\Facades\Hash;

class SocialAuthController extends Controller
{
    /**
 * @OA\Get(
 *     path="/api/auth/redirect/google",
 *     tags={"Autenticación Social"},
 *     summary="Redirigir a Google para iniciar sesión",
 *     description="Esta ruta redirige al usuario a Google para el inicio de sesión.",
 *     operationId="redirectToGoogle",
 *     @OA\Response(
 *         response=302,
 *         description="Redirección a Google"
 *     )
 * )
 */
    public function redirectToGoogle()
    {
        return Socialite::driver('google')->stateless()->redirect();
    }

    /**
 * @OA\Get(
 *     path="/api/auth/callback/google",
 *     tags={"Autenticación Social"},
 *     summary="Callback de Google después del login",
 *     description="Procesa la información del usuario devuelta por Google y genera un token Sanctum.",
 *     operationId="handleGoogleCallback",
 *     @OA\Response(
 *         response=200,
 *         description="Token generado exitosamente",
 *         @OA\JsonContent(
 *             @OA\Property(property="token", type="string", example="1|abcd1234...")
 *         )
 *     ),
 *     @OA\Response(
 *         response=500,
 *         description="Error al procesar los datos de Google"
 *     )
 * )
 */

    public function handleGoogleCallback()
    {
        $googleUser = Socialite::driver('google')->stateless()->user();

        $usuario = Usuario::firstOrCreate(
            ['email' => $googleUser->getEmail()],
            [
                'nombre' => $googleUser->getName(),
                'contrasenia' => Hash::make(uniqid()),
                'cedula' => '00000000', // Asignar valores por defecto si son requeridos
                'telefono' => '00000000',
                'latitud' => 0,
                'longitud' => 0
            ]
        );

        $token = $usuario->createToken('token-personal')->plainTextToken;

        return response()->json(['token' => $token]);
    }
}