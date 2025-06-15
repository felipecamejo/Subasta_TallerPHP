<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\Usuario;
use App\Models\Cliente;
use App\Models\Rematador;
use App\Models\CasaRemate;
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
     *     summary="Iniciar sesión",
     *     tags={"Autenticación"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"email","password"},
     *             @OA\Property(property="email", type="string", example="test@example.com"),
     *             @OA\Property(property="password", type="string", example="123456")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Token generado correctamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="token", type="string", example="eyJ0eXAiOiJKV1QiLCJhbGciOi...")
     *         )
     *     ),
     *     @OA\Response(response=401, description="Credenciales inválidas")
     * )
     */
    public function login(Request $request)
    {
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
        $rol = $usuario->cliente ? 'cliente' : ($usuario->rematador ? 'rematador' : ($usuario->casaRemate ? 'casa_remate' : null));

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
     *     path="/api/register",
     *     summary="Registrar un nuevo usuario",
     *     tags={"Autenticación"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"nombre", "cedula", "email", "telefono", "contrasenia", "tipo"},
     *             @OA\Property(property="nombre", type="string", example="Juan Pérez"),
     *             @OA\Property(property="cedula", type="string", example="12345678"),
     *             @OA\Property(property="email", type="string", format="email", example="juan@example.com"),
     *             @OA\Property(property="telefono", type="string", example="098765432"),
     *             @OA\Property(property="imagen", type="string", nullable=true, example="foto.png"),
     *             @OA\Property(property="contrasenia", type="string", format="password", example="secret123"),
     *             @OA\Property(property="latitud", type="number", format="float", nullable=true, example=-34.6037),
     *             @OA\Property(property="longitud", type="number", format="float", nullable=true, example=-58.3816),
     *             @OA\Property(property="tipo", type="string", enum={"cliente", "rematador"}, example="rematador"),
     *             @OA\Property(property="matricula", type="string", nullable=true, example="ABC123")
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Usuario registrado exitosamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Usuario registrado exitosamente"),
     *             @OA\Property(property="token", type="string", example="1|abcDEF123...")
     *         )
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Datos inválidos",
     *         @OA\JsonContent(
     *             @OA\Property(property="errors", type="object")
     *         )
     *     )
     * )
     */
    public function register(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string',
            'cedula' => 'required|string|unique:usuarios,cedula',
            'email' => 'required|email|unique:usuarios,email',
            'telefono' => 'required|string',
            'imagen' => 'nullable|string',
            'contrasenia' => 'required|string|min:6',
            'latitud' => 'nullable|numeric',
            'longitud' => 'nullable|numeric',
            'tipo' => 'required|in:cliente,rematador,casa_remate',
            'matricula' => 'required_if:tipo,rematador|string|nullable',
            'idFiscal' => 'required_if:tipo,casa_remate|string|nullable',
        ]);

        $usuario = Usuario::create([
            'nombre' => $request->nombre,
            'cedula' => $request->cedula,
            'email' => $request->email,
            'telefono' => $request->telefono,
            'imagen' => $request->imagen,
            'contrasenia' => Hash::make($request->contrasenia),
            'latitud' => $request->latitud,
            'longitud' => $request->longitud,
        ]);

        if ($request->tipo === 'cliente') {
            $usuario->cliente()->create(['calificacion' => 0]);
        } elseif ($request->tipo === 'rematador') {
            $usuario->rematador()->create(['matricula' => $request->matricula]);
        } elseif ($request->tipo === 'casa_remate') {
            $usuario->casaRemate()->create([
                'idFiscal' => $request->idFiscal,
                'calificacion' => json_encode([]),
            ]);
        }

        $token = $usuario->createToken('token-personal')->plainTextToken;

        event(new Registered($usuario));

        return response()->json([
            'message' => 'Usuario registrado exitosamente. Se envió un correo de verificación.',
            'token' => $token,
            'usuario_id' => $usuario->id,
            'email_verified' => $usuario->hasVerifiedEmail()
        ], 201);
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
                Cliente::create(['usuario_id' => $usuario->id]);
            } elseif ($request->rol === 'casa_remate') {
                CasaRemate::create([
                    'usuario_id' => $usuario->id,
                    'idFiscal' => $request->idFiscal,
                    'calificacion' => json_encode([]),
                ]);
            }
        }

        if (!$usuario->hasVerifiedEmail()) {
            $usuario->markEmailAsVerified();
        }

        // ✅ Resuelto el conflicto
        $usuario->load(['rematador', 'cliente', 'casaRemate']);

        $rol = 'cliente';
        if ($usuario->rematador) {
            $rol = 'rematador';
        } elseif ($usuario->casaRemate) {
            $rol = 'casa_remate';
        }

        $token = $usuario->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'usuario_id' => $usuario->id,
            'rol' => $rol,
            'usuario' => $usuario,
        ]);
    }

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
                    event(new PasswordReset($user));
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
