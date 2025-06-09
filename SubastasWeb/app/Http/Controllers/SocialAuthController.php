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
 *     path="/auth/callback/google",
 *     tags={"Autenticación Social"},
 *     summary="Callback de Google después del login",
 *     description="Procesa el usuario de Google. Si existe, lo autentica. Si no, redirige al frontend con datos para completar el registro.",
 *     operationId="handleGoogleCallback",
 *     @OA\Response(
 *         response=302,
 *         description="Redirección al frontend con token si el usuario ya existe o con datos de Google para completar registro"
 *     )
 * )
 */
    public function handleGoogleCallback(Request $request)
{
    $rol = session('rol');

    if (!in_array($rol, ['cliente', 'rematador'])) {
        return redirect('http://localhost:4200/login?error=rol-invalido');
    }

    $googleUser = Socialite::driver('google')->stateless()->user();

    $usuario = Usuario::where('email', $googleUser->getEmail())->first();

    if (!$usuario) {
        // Usuario no registrado → redirigir al frontend para completar datos
        $query = http_build_query([
            'nombre' => $googleUser->getName(),
            'email' => $googleUser->getEmail(),
            'imagen' => $googleUser->getAvatar(),
            'rol' => $rol,
            'nuevo' => true
        ]);

        return redirect("http://localhost:4200/registro-google?$query");
    }

    // Usuario ya registrado → generar token
    $token = $usuario->createToken('token-google')->plainTextToken;

    return redirect("http://localhost:4200/login-google?" . http_build_query([
        'token' => $token,
        'usuario_id' => $usuario->id,
        'rol' => $usuario->rematador ? 'rematador' : 'cliente'
    ]));
}


}