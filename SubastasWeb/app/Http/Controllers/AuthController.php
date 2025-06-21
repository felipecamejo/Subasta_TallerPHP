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
    *             @OA\Property(property="token", type="string"),
    *             @OA\Property(property="usuario_id", type="integer"),
    *             @OA\Property(property="rol", type="string"),
    *             @OA\Property(property="usuario", type="object")
    *         )
    *     ),
    *     @OA\Response(response=401, description="Credenciales inválidas")
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
        } elseif ($usuario->admin) {
            $rol = 'admin';
        }

        return response()->json([
            'token' => $token,
            'usuario_id' => $usuario->id,
            'rol' => $rol,
            'usuario' => $usuario
        ], 200);
    }

    /**
    * @OA\Post(
    *     path="/api/logout",
    *     summary="Cerrar sesión del usuario autenticado",
    *     tags={"Autenticación"},
    *     security={{"sanctum":{}}},
    *     @OA\Response(
    *         response=200,
    *         description="Sesión cerrada correctamente",
    *         @OA\JsonContent(
    *             @OA\Property(property="message", type="string", example="Sesión cerrada correctamente")
    *         )
    *     ),
    *     @OA\Response(response=401, description="No autenticado")
    * )
    */

    public function logout(Request $request){
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
    *             required={"nombre", "cedula", "email", "telefono", "contrasenia", "rol"},
    *             @OA\Property(property="nombre", type="string", example="Ana Gómez"),
    *             @OA\Property(property="cedula", type="string", example="45678901"),
    *             @OA\Property(property="email", type="string", example="ana@example.com"),
    *             @OA\Property(property="telefono", type="string", example="098765432"),
    *             @OA\Property(property="imagen", type="string", nullable=true, example="https://example.com/avatar.jpg"),
    *             @OA\Property(property="contrasenia", type="string", example="clave123"),
    *             @OA\Property(property="latitud", type="number", format="float", example=-34.9011),
    *             @OA\Property(property="longitud", type="number", format="float", example=-56.1645),
    *             @OA\Property(property="rol", type="string", enum={"cliente", "rematador", "casa_remate"}),
    *             @OA\Property(property="matricula", type="string", nullable=true, example="MAT456"),
    *             @OA\Property(property="idFiscal", type="string", nullable=true, example="FISC999")
    *         )
    *     ),
    *     @OA\Response(
    *         response=201,
    *         description="Usuario registrado exitosamente",
    *         @OA\JsonContent(
    *             @OA\Property(property="message", type="string", example="Usuario registrado exitosamente. Se envió un correo de verificación."),
    *             @OA\Property(property="usuario_id", type="integer", example=1)
    *         )
    *     ),
    *     @OA\Response(response=422, description="Error de validación")
    * )
    */


public function register(Request $request){
    $request->validate([
        'nombre' => 'required|string|max:255',
        'cedula' => 'required|string|max:255|unique:usuarios',
        'email' => 'required|email|unique:usuarios,email',
        'telefono' => 'required|string',
        'imagen' => 'nullable|string',
        'contrasenia' => 'required|string|min:6',
        'latitud' => 'nullable|numeric',
        'longitud' => 'nullable|numeric',
        'rol' => 'required|in:cliente,rematador,casa_remate',
        'matricula' => 'required_if:rol,rematador|string|nullable',
        'idFiscal' => 'required_if:rol,casa_remate|string|nullable',
    ]);

    $usuario = Usuario::create([
        'nombre' => $request->nombre,
        'cedula' => $request->cedula,
        'email' => $request->email,
        'telefono' => $request->telefono,
        'contrasenia' => Hash::make($request->contrasenia),
        'latitud' => $request->latitud,
        'longitud' => $request->longitud,
    ]);

    if ($request->rol === 'cliente') {
        Cliente::create(['usuario_id' => $usuario->id]);
    } elseif ($request->rol === 'rematador') {
        Rematador::create([
            'usuario_id' => $usuario->id,
            'matricula' => $request->matricula,
        ]);
    } elseif ($request->rol === 'casa_remate') {
        $usuario->casaRemate()->create([
            'idFiscal' => $request->idFiscal,
            'calificacion' => json_encode([])
        ]);
    }

    try {
    event(new Registered($usuario));

    return response()->json([
        'message' => 'Usuario registrado exitosamente. Se envió un correo de verificación.',
        'usuario_id' => $usuario->id,
    ], 201);
    } catch (\Exception $e) {
    \Log::error('Error al enviar correo de verificación en el registro: ' . $e->getMessage());

    return response()->json([
        'message' => 'Usuario registrado exitosamente, pero no se pudo enviar el correo de verificación. Intente más tarde.',
        'usuario_id' => $usuario->id,
    ], 201);
}

    }
    
    /**
    * @OA\Post(
    *     path="/api/register-casa-remate",
    *     summary="Registrar una nueva casa de remate",
    *     tags={"Autenticación"},
    *     @OA\RequestBody(
    *         required=true,
    *         @OA\JsonContent(
    *             required={"nombre", "idFiscal", "email", "telefono", "contrasenia", "latitud", "longitud"},
    *             @OA\Property(property="nombre", type="string", example="Casa Los Robles"),
    *             @OA\Property(property="idFiscal", type="string", example="CR123456"),
    *             @OA\Property(property="email", type="string", example="casa@remates.com"),
    *             @OA\Property(property="telefono", type="string", example="092334455"),
    *             @OA\Property(property="contrasenia", type="string", example="supersegura123"),
    *             @OA\Property(property="latitud", type="number", format="float", example=-34.90),
    *             @OA\Property(property="longitud", type="number", format="float", example=-56.15)
    *         )
    *     ),
    *     @OA\Response(
    *         response=201,
    *         description="Casa de remate registrada exitosamente",
    *         @OA\JsonContent(
    *             @OA\Property(property="message", type="string", example="Casa de remate registrada exitosamente. Se envió un correo de verificación. Queda pendiente de aprobación del admin."),
    *             @OA\Property(property="usuario_id", type="integer", example=12)
    *         )
    *     ),
    *     @OA\Response(response=422, description="Error de validación")
    * )
    */

    public function registerCasaRemate(Request $request){
        $request->validate([
            'nombre' => 'required|string|max:255',
            'idFiscal' => 'required|string|max:255|unique:casa_remates,idFiscal',
            'email' => 'required|email|unique:usuarios,email',
            'telefono' => 'required|string|max:255',
            'contrasenia' => 'required|string|min:8',
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
    *     path="/api/registro/google",
    *     summary="Iniciar sesión o registrarse con Google",
    *     tags={"Autenticación"},
    *     @OA\RequestBody(
    *         required=true,
    *         @OA\JsonContent(
    *             required={"token", "rol"},
    *             @OA\Property(property="token", type="string", example="GOOGLE_ID_TOKEN"),
    *             @OA\Property(property="rol", type="string", enum={"cliente", "rematador", "casa_remate"}, example="rematador"),
    *             @OA\Property(property="matricula", type="string", nullable=true, example="MAT1234"),
    *             @OA\Property(property="idFiscal", type="string", nullable=true, example="CR9876")
    *         )
    *     ),
    *     @OA\Response(
    *         response=200,
    *         description="Inicio de sesión o registro exitoso",
    *         @OA\JsonContent(
    *             @OA\Property(property="access_token", type="string", example="token123"),
    *             @OA\Property(property="token_type", type="string", example="Bearer"),
    *             @OA\Property(property="usuario_id", type="integer", example=5),
    *             @OA\Property(property="rol", type="string", example="rematador"),
    *             @OA\Property(property="usuario", type="object")
    *         )
    *     ),
    *     @OA\Response(response=403, description="La casa de remate aún no fue aprobada por un administrador"),
    *     @OA\Response(response=422, description="Error de validación")
    * )
    */
    public function loginWithGoogle(Request $request){
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
                'email_verified_at' => now(),
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
                    'activo' => false,
                ]);
            }
        }

        if (!$usuario->hasVerifiedEmail()) {
            $usuario->markEmailAsVerified();
        }

        if ($usuario->casaRemate && !$usuario->casaRemate->activo) {
            return response()->json([
                'error' => 'La casa de remate aún no fue aprobada por un administrador.'
            ], 403);
        }

        $token = $usuario->createToken('auth_token')->plainTextToken;

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
    *     summary="Completar registro de usuario con Google",
    *     tags={"Autenticación"},
    *     @OA\RequestBody(
    *         required=true,
    *         @OA\JsonContent(
    *             required={"nombre", "cedula", "email", "telefono", "contrasenia", "latitud", "longitud", "rol", "google_id"},
    *             @OA\Property(property="nombre", type="string", example="Lucía Fernández"),
    *             @OA\Property(property="cedula", type="string", example="56789012"),
    *             @OA\Property(property="email", type="string", example="lucia@gmail.com"),
    *             @OA\Property(property="telefono", type="string", example="098112233"),
    *             @OA\Property(property="contrasenia", type="string", example="claveGoogle2024"),
    *             @OA\Property(property="latitud", type="number", format="float", example=-34.91),
    *             @OA\Property(property="longitud", type="number", format="float", example=-56.16),
    *             @OA\Property(property="rol", type="string", enum={"cliente", "rematador", "casa_remate"}, example="rematador"),
    *             @OA\Property(property="google_id", type="string", example="1234567890abcdef"),
    *             @OA\Property(property="matricula", type="string", nullable=true, example="MAT9876"),
    *             @OA\Property(property="idFiscal", type="string", nullable=true, example="FISC1234"),
    *             @OA\Property(property="imagen", type="string", nullable=true, example="https://example.com/foto.png")
    *         )
    *     ),
    *     @OA\Response(
    *         response=201,
    *         description="Usuario registrado exitosamente con Google",
    *         @OA\JsonContent(
    *             @OA\Property(property="message", type="string", example="Usuario registrado con Google exitosamente."),
    *             @OA\Property(property="access_token", type="string", example="google_token_123"),
    *             @OA\Property(property="usuario_id", type="integer", example=7),
    *             @OA\Property(property="rol", type="string", example="rematador")
    *         )
    *     ),
    *     @OA\Response(response=422, description="Error de validación")
    * )
    */
    public function registerGoogleUser(Request $request){
        $data = $request->validate([
            'nombre' => 'required|string|max:255',
            'cedula' => 'required|string|max:255|unique:usuarios',
            'email' => 'required|email|unique:usuarios',
            'telefono' => 'required|string|max:255',
            'contrasenia' => 'required|string|min:8',
            'latitud' => 'required|numeric',
            'longitud' => 'required|numeric',
            'rol' => 'required|in:cliente,rematador,casa_remate',
            'google_id' => 'required|string|unique:usuarios,google_id',
            'matricula' => 'nullable|string|required_if:rol,rematador',
            'idFiscal' => 'nullable|string|required_if:rol,casa_remate|unique:casa_remates,idFiscal',
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
            'email_verified_at' => now(),
        ]);

        if ($data['rol'] === 'cliente') {
            Cliente::create(['usuario_id' => $usuario->id]);
        } elseif ($data['rol'] === 'rematador') {
            Rematador::create([
                'usuario_id' => $usuario->id,
                'matricula' => $data['matricula'],
            ]);
        } elseif ($data['rol'] === 'casa_remate') {
            CasaRemate::create([
                'usuario_id' => $usuario->id,
                'idFiscal' => $data['idFiscal'],
                'activo' => false,
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

    /**
    * @OA\Post(
    *     path="/api/forgot-password",
    *     summary="Enviar enlace de recuperación de contraseña",
    *     tags={"Autenticación"},
    *     @OA\RequestBody(
    *         required=true,
    *         @OA\JsonContent(
    *             required={"email"},
    *             @OA\Property(property="email", type="string", example="usuario@example.com")
    *         )
    *     ),
    *     @OA\Response(
    *         response=200,
    *         description="Enlace de recuperación enviado",
    *         @OA\JsonContent(
    *             @OA\Property(property="message", type="string", example="We have emailed your password reset link!")
    *         )
    *     ),
    *     @OA\Response(
    *         response=400,
    *         description="No se pudo enviar el correo de recuperación",
    *         @OA\JsonContent(
    *             @OA\Property(property="error", type="string", example="No se pudo enviar el enlace")
    *         )
    *     )
    * )
    */

    public function enviarLinkReset(Request $request){
        $request->validate(['email' => 'required|email']);

        $status = Password::sendResetLink(
            $request->only('email')
        );

        return $status === Password::RESET_LINK_SENT
            ? response()->json(['message' => __($status)])
            : response()->json(['error' => __($status)], 400);
    }

    /**
    * @OA\Post(
    *     path="/api/reset-password",
    *     summary="Restablecer contraseña del usuario",
    *     tags={"Autenticación"},
    *     @OA\RequestBody(
    *         required=true,
    *         @OA\JsonContent(
    *             required={"token", "email", "password"},
    *             @OA\Property(property="token", type="string", example="TOKEN123"),
    *             @OA\Property(property="email", type="string", example="usuario@example.com"),
    *             @OA\Property(property="password", type="string", example="nuevaClaveSegura"),
    *             @OA\Property(property="password_confirmation", type="string", example="nuevaClaveSegura")
    *         )
    *     ),
    *     @OA\Response(
    *         response=200,
    *         description="Contraseña restablecida con éxito",
    *         @OA\JsonContent(
    *             @OA\Property(property="message", type="string", example="Your password has been reset!")
    *         )
    *     ),
    *     @OA\Response(
    *         response=400,
    *         description="Error al restablecer contraseña",
    *         @OA\JsonContent(
    *             @OA\Property(property="error", type="string", example="Este token es inválido")
    *         )
    *     )
    * )
    */

    public function resetearContrasena(Request $request){
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

    /**
    * @OA\Post(
    *     path="/api/email/resend",
    *     summary="Reenviar correo de verificación",
    *     tags={"Autenticación"},
    *     @OA\RequestBody(
    *         required=true,
    *         @OA\JsonContent(
    *             required={"email"},
    *             @OA\Property(property="email", type="string", format="email", example="usuario@example.com")
    *         )
    *     ),
    *     @OA\Response(
    *         response=200,
    *         description="Correo de verificación reenviado exitosamente",
    *         @OA\JsonContent(
    *             @OA\Property(property="message", type="string", example="Correo de verificación reenviado.")
    *         )
    *     ),
    *     @OA\Response(
    *         response=400,
    *         description="El correo ya fue verificado",
    *         @OA\JsonContent(
    *             @OA\Property(property="message", type="string", example="El correo ya fue verificado.")
    *         )
    *     ),
    *     @OA\Response(
    *         response=404,
    *         description="Usuario no encontrado",
    *         @OA\JsonContent(
    *             @OA\Property(property="error", type="string", example="Usuario no encontrado.")
    *         )
    *     )
    * )
    */


public function reenviarEmailVerificacion(Request $request)
{
    $request->validate(['email' => 'required|email']);

    $usuario = Usuario::where('email', $request->email)->first();

    if (!$usuario) {
        return response()->json(['error' => 'Usuario no encontrado.'], 404);
    }

    if ($usuario->hasVerifiedEmail()) {
        return response()->json(['message' => 'El correo ya fue verificado.'], 400);
    }

    try {
        $usuario->sendEmailVerificationNotification();
        return response()->json(['message' => 'Correo de verificación reenviado.'], 200);
    } catch (\Exception $e) {
        \Log::error('Error al reenviar correo de verificación: ' . $e->getMessage());

        return response()->json([
            'error' => 'No se pudo enviar el correo de verificación. Por favor, intente más tarde.'
        ], 500);
    }
}
}
