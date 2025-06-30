<?php

namespace App\Http\Controllers;

use Laravel\Socialite\Facades\Socialite;
use Illuminate\Http\Request;
use App\Models\Usuario;

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
     *         description="Rol del usuario: cliente, rematador o casa_remate",
     *         @OA\Schema(type="string", enum={"cliente", "rematador", "casa_remate"})
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

        if (!in_array($rol, ['cliente', 'rematador', 'casa_remate'])) {
            return response()->json(['error' => 'Rol inválido'], 400);
        }

        session(['rol' => $rol]);

        return Socialite::driver('google')
            ->stateless()
            ->with(['state' => $rol]) // usamos el parámetro `state` para enviar el rol
            ->redirect();
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
        $frontend = trim(env('FRONTEND_URL', 'http://localhost:4200'));
        $rol = $request->input('state'); 

        if (!in_array($rol, ['cliente', 'rematador', 'casa_remate'])) {
            return redirect()->away("$frontend/login?error=rol-invalido");
        }

        $googleUser = Socialite::driver('google')->stateless()->user();
        $usuario = Usuario::where('email', $googleUser->getEmail())->first();

        if (!$usuario) {
            $query = http_build_query([
                'nombre' => $googleUser->getName(),
                'email' => $googleUser->getEmail(),
                'imagen' => $googleUser->getAvatar(),
                'rol' => $rol,
                'nuevo' => true,
                'google_id' => $googleUser->getId(),
            ]);

            return redirect()->away("$frontend/registro-google?$query");
        }

        $token = $usuario->createToken('token-google')->plainTextToken;

        $rolDetectado = null;
        if ($usuario->rematador) {
            $rolDetectado = 'rematador';
        } elseif ($usuario->cliente) {
            $rolDetectado = 'cliente';
        } elseif ($usuario->casaRemate) {
            $rolDetectado = 'casa_remate';
        }

        return redirect()->away("$frontend/login-google?" . http_build_query([
            'token' => $token,
            'usuario_id' => $usuario->id,
            'rol' => $rolDetectado
        ]));
    }
}
