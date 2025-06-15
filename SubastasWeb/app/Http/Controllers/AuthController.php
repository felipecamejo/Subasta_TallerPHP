<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\Usuario;
use App\Models\Cliente;
use App\Models\Rematador;
use App\Models\CasaRemate;
use App\Models\Admin;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Password;
use Illuminate\Auth\Events\PasswordReset;

class AuthController extends Controller
{
/**
 * @OA\Post(
 *     path="/api/login",
 *     summary="Iniciar sesión con email y contraseña",
 *     tags={"Autenticación"},
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(
 *             required={"email", "password"},
 *             @OA\Property(property="email", type="string", example="usuario@correo.com"),
 *             @OA\Property(property="password", type="string", format="password", example="12345678")
 *         )
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Inicio de sesión exitoso",
 *         @OA\JsonContent(
 *             @OA\Property(property="token", type="string", example="1|abc123"),
 *             @OA\Property(property="usuario_id", type="integer", example=5),
 *             @OA\Property(property="rol", type="string", example="cliente")
 *         )
 *     ),
 *     @OA\Response(response=401, description="Credenciales inválidas"),
 *     @OA\Response(response=403, description="Email no verificado")
 * )
 */


   public function login(Request $request){
        $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        $usuario = Usuario::where('email', $request->email)->first();

        if (!$usuario || !Hash::check($request->password, $usuario->contrasenia)) {
            return response()->json(['error' => 'Credenciales inválidas'], 401);
        }

        if (!$usuario->hasVerifiedEmail()) {
            return response()->json(['error' => 'Debés verificar tu correo electrónico antes de iniciar sesión.'], 403);
        }

        $token = $usuario->createToken('token-personal')->plainTextToken;

        $rol = null;
        if ($usuario->cliente) {
            $rol = 'cliente';
        } elseif ($usuario->rematador) {
            $rol = 'rematador';
        } elseif ($usuario->casaRemate) {
            $rol = 'casa_remate';
        } elseif (Admin::where('usuario_id', $usuario->id)->exists()) {
            $rol = 'admin';
        }

        return response()->json([
            'token' => $token,
            'usuario_id' => $usuario->id,
            'rol' => $rol
        ], 200);
    }

    /**
     * @OA\Post(
     *     path="/api/logout",
     *     tags={"Autenticación"},
     *     summary="Cerrar sesión",
     *     description="Revoca el token del usuario autenticado",
     *     operationId="logoutUser",
     *     security={{"sanctum":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Sesión cerrada correctamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Sesión cerrada con éxito")
     *         )
     *     )
     * )
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Sesión cerrada correctamente']);
    }

    /**
 * @OA\Post(
 *     path="/api/register-casa-remate",
 *     summary="Registrar una casa de remate",
 *     tags={"Autenticación"},
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(
 *             required={"nombre", "idFiscal", "email", "telefono", "contrasenia", "latitud", "longitud"},
 *             @OA\Property(property="nombre", type="string", example="Subastas S.A."),
 *             @OA\Property(property="idFiscal", type="string", example="RUT-789456123"),
 *             @OA\Property(property="email", type="string", format="email", example="casa@remate.com"),
 *             @OA\Property(property="telefono", type="string", example="099123456"),
 *             @OA\Property(property="contrasenia", type="string", format="password", example="claveSegura123"),
 *             @OA\Property(property="latitud", type="number", example=-34.9011),
 *             @OA\Property(property="longitud", type="number", example=-56.1645)
 *         )
 *     ),
 *     @OA\Response(
 *         response=201,
 *         description="Casa de remate registrada exitosamente",
 *         @OA\JsonContent(
 *             @OA\Property(property="message", type="string", example="Casa de remate registrada exitosamente. Se envió un correo de verificación. Queda pendiente de aprobación del admin."),
 *             @OA\Property(property="usuario_id", type="integer", example=7)
 *         )
 *     ),
 *     @OA\Response(response=422, description="Error de validación")
 * )
 */

    public function registerCasaRemate(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'idFiscal' => 'required|string|max:255|unique:casa_remates,idFiscal',
            'email' => 'required|email|unique:usuarios,email',
            'telefono' => 'required|string|max:255',
            'contrasenia' => 'required|string|min:6',
            'latitud' => 'required|numeric',
            'longitud' => 'required|numeric',
        ]);

        $usuario = Usuario::create([
            'nombre' => $request->nombre,
            'cedula' => '',
            'email' => $request->email,
            'telefono' => $request->telefono,
            'contrasenia' => Hash::make($request->contrasenia),
            'latitud' => $request->latitud,
            'longitud' => $request->longitud,
        ]);

        $usuario->casaRemate()->create([
            'idFiscal' => $request->idFiscal,
            'activo' => false,
        ]);

        event(new Registered($usuario));

        return response()->json([
            'message' => 'Casa de remate registrada exitosamente. Se envió un correo de verificación. Queda pendiente de aprobación del admin.',
            'usuario_id' => $usuario->id,
        ], 201);
    }

    /**
 * @OA\Post(
 *     path="/api/login-with-google",
 *     summary="Iniciar sesión con Google",
 *     tags={"Autenticación"},
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(
 *             required={"token", "rol"},
 *             @OA\Property(property="token", type="string", example="ya29.a0AfH6SM..."),
 *             @OA\Property(property="rol", type="string", enum={"cliente", "rematador", "casa_remate"}, example="cliente"),
 *             @OA\Property(property="matricula", type="string", nullable=true, example="MAT123"),
 *             @OA\Property(property="idFiscal", type="string", nullable=true, example="RUT12345678")
 *         )
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Inicio de sesión exitoso",
 *         @OA\JsonContent(
 *             @OA\Property(property="access_token", type="string", example="1|token..."),
 *             @OA\Property(property="token_type", type="string", example="Bearer"),
 *             @OA\Property(property="usuario_id", type="integer", example=12),
 *             @OA\Property(property="rol", type="string", example="cliente"),
 *             @OA\Property(property="usuario", type="object")
 *         )
 *     ),
 *     @OA\Response(response=403, description="El usuario es admin o acceso no permitido"),
 *     @OA\Response(response=422, description="Error de validación")
 * )
 */

    public function aprobarCasaRemate(Request $request, $id)
    {
        $request->validate([
            'admin_id' => 'required|exists:admins,usuario_id'
        ]);

        $casa = CasaRemate::findOrFail($id);
        $casa->activo = true;
        $casa->aprobado_por = Admin::where('usuario_id', $request->admin_id)->first()?->usuario?->email ?? 'admin';
        $casa->aprobado_en = now();
        $casa->save();

        return response()->json(['message' => 'Casa de remate aprobada exitosamente']);
    }

public function loginWithGoogle(Request $request)
{
    $request->validate([
        'token' => 'required|string',
        'rol' => 'required|in:cliente,rematador,casa_remate',
        'matricula' => 'required_if:rol,rematador|nullable|string|unique:rematadores,matricula',
        'idFiscal' => 'required_if:rol,casa_remate|nullable|string|unique:casa_remates,idFiscal',
    ]);

    $googleUser = Socialite::driver('google')->stateless()->userFromToken($request->token);
    $usuario = Usuario::firstWhere('email', $googleUser->getEmail());

    if (!$usuario) {
        $usuario = Usuario::create([
            'nombre' => $googleUser->getName(),
            'email' => $googleUser->getEmail(),
            'cedula' => '',
            'telefono' => '',
            'imagen' => $googleUser->getAvatar(),
            'contrasenia' => bcrypt(Str::random(16)),
        ]);

        if ($request->rol === 'rematador') {
            Rematador::create([
                'usuario_id' => $usuario->id,
                'matricula' => $request->matricula,
            ]);
        } elseif ($request->rol === 'cliente') {
            Cliente::create([
                'usuario_id' => $usuario->id,
            ]);
        } elseif ($request->rol === 'casa_remate') {
            CasaRemate::create([
                'usuario_id' => $usuario->id,
                'idFiscal' => $request->idFiscal,
                'activo' => false, // Hasta aprobación del admin
            ]);
        }
    }

    if (!$usuario->hasVerifiedEmail()) {
        $usuario->markEmailAsVerified();
    }

    $token = $usuario->createToken('auth_token')->plainTextToken;

    // Determinar el rol
    $rol = null;
    if ($usuario->rematador) {
        $rol = 'rematador';
    } elseif ($usuario->cliente) {
        $rol = 'cliente';
    } elseif ($usuario->casaRemate) {
        $rol = 'casa_remate';
    }

    return response()->json([
        'access_token' => $token,
        'token_type' => 'Bearer',
        'usuario_id' => $usuario->id,
        'rol' => $rol,
        'usuario' => $usuario,
    ]);
}

/**
 * @OA\Post(
 *     path="/api/register-google-user",
 *     summary="Registrar usuario con Google",
 *     tags={"Autenticación"},
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(
 *             required={
 *                 "nombre", "cedula", "email", "telefono", "contrasenia",
 *                 "latitud", "longitud", "rol", "google_id"
 *             },
 *             @OA\Property(property="nombre", type="string", example="Juan Pérez"),
 *             @OA\Property(property="cedula", type="string", example="12345678"),
 *             @OA\Property(property="email", type="string", format="email", example="juan@gmail.com"),
 *             @OA\Property(property="telefono", type="string", example="099123456"),
 *             @OA\Property(property="contrasenia", type="string", format="password", example="secreta123"),
 *             @OA\Property(property="latitud", type="number", format="float", example=-34.9011),
 *             @OA\Property(property="longitud", type="number", format="float", example=-56.1645),
 *             @OA\Property(property="rol", type="string", enum={"cliente", "rematador"}, example="cliente"),
 *             @OA\Property(property="google_id", type="string", example="1234567890abcdef"),
 *             @OA\Property(property="matricula", type="string", nullable=true, example="MAT-987"),
 *             @OA\Property(property="imagen", type="string", nullable=true, example="https://lh3.googleusercontent.com/a/...")
 *         )
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Usuario registrado exitosamente con Google",
 *         @OA\JsonContent(
 *             @OA\Property(property="message", type="string", example="Usuario registrado con Google exitosamente."),
 *             @OA\Property(property="access_token", type="string", example="1|aVeryLongTokenHere"),
 *             @OA\Property(property="usuario_id", type="integer", example=5),
 *             @OA\Property(property="rol", type="string", example="cliente")
 *         )
 *     ),
 *     @OA\Response(
 *         response=422,
 *         description="Error de validación",
 *         @OA\JsonContent(
 *             @OA\Property(property="errors", type="object")
 *         )
 *     )
 * )
 */

public function registerGoogleUser(Request $request)
{
    $data = $request->validate([
        'nombre' => 'required|string|max:255',
        'cedula' => 'required|string|max:255|unique:usuarios',
        'email' => 'required|email|unique:usuarios',
        'telefono' => 'required|string|max:255',
        'contrasenia' => 'required|string|min:6',
        'latitud' => 'required|numeric',
        'longitud' => 'required|numeric',
        'rol' => 'required|in:cliente,rematador',
        'google_id' => 'required|string|unique:usuarios,google_id',
        'matricula' => 'nullable|string|required_if:rol,rematador',
        'imagen' => 'nullable|string'
    ]);

    $usuario = Usuario::create([
        'nombre' => $data['nombre'],
        'cedula' => $data['cedula'],
        'email' => $data['email'],
        'telefono' => $data['telefono'],
        'contrasenia' => bcrypt($data['contrasenia']),
        'latitud' => $data['latitud'],
        'longitud' => $data['longitud'],
        'imagen' => $data['imagen'] ?? null,
        'google_id' => $data['google_id'],
    ]);

    if ($data['rol'] === 'cliente') {
        Cliente::create(['usuario_id' => $usuario->id]);
    } else {
        Rematador::create([
            'usuario_id' => $usuario->id,
            'matricula' => $data['matricula'],
        ]);
    }

    $token = $usuario->createToken('token-google')->plainTextToken;

    return response()->json([
        'message' => 'Usuario registrado con Google exitosamente.',
        'access_token' => $token,
        'usuario_id' => $usuario->id,
        'rol' => $data['rol'],
    ]);
}

public function enviarLinkReset(Request $request)
{
    $request->validate(['email' => 'required|email']);

    $status = Password::sendResetLink(
        $request->only('email')
    );

    return $status === Password::RESET_LINK_SENT
        ? response()->json(['message' => __($status)])
        : response()->json(['error' => __($status)], 400);
}

public function resetearContrasena(Request $request)
{
    $request->validate([
        'token' => 'required',
        'email' => 'required|email',
        'password' => 'required|min:8|confirmed',
    ]);

    try {
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                

                $user->contrasenia = Hash::make($password);
                $user->save();

                event(new \Illuminate\Auth\Events\PasswordReset($user));
            }
        );

        return $status === Password::PASSWORD_RESET
            ? response()->json(['message' => __($status)])
            : response()->json(['error' => __($status)], 400);
    } catch (\Throwable $e) {
        \Log::error('Error al resetear contraseña: ' . $e->getMessage());
        return response()->json(['error' => 'Error interno del servidor'], 500);
    }
}

}