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

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Sesión cerrada correctamente']);
    }

    public function register(Request $request)
{
    $request->validate([
        'nombre' => 'required|string|max:255',
        'cedula' => 'required|string|max:255|unique:usuarios',
        'email' => 'required|email|unique:usuarios,email',
        'telefono' => 'required|string|max:255',
        'contrasenia' => 'required|string|min:8|confirmed',
        'latitud' => 'required|numeric',
        'longitud' => 'required|numeric',
        'rol' => 'required|in:cliente,rematador',
        'matricula' => 'required_if:rol,rematador|nullable|string|unique:rematadores,matricula',
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
    }

    event(new Registered($usuario));

    return response()->json([
        'message' => 'Usuario registrado exitosamente. Se envió un correo de verificación.',
        'usuario_id' => $usuario->id,
    ], 201);
}

    public function registerCasaRemate(Request $request)
    {
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

    public function registerGoogleUser(Request $request)
    {
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
