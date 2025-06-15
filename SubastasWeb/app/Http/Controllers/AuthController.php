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

        $token = $usuario->createToken('token-personal')->plainTextToken;
        $rol = $usuario->cliente ? 'cliente' : ($usuario->rematador ? 'rematador' : null);

        return response()->json(['token' => $token,  'usuario_id' => $usuario->id,
    'rol' => $rol    ], 200);
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
    
    // Crear el usuario
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
    } else if ($request->tipo === 'rematador') {
        $usuario->rematador()->create([
            'matricula' => $request->matricula
        ]);
    } else if ($request->tipo === 'casa_remate') {
        $usuario->casaRemate()->create([
            'idFiscal' => $request->idFiscal,
            'calificacion' => json_encode([])
        ]);
    }

    $token = $usuario->createToken('token-personal')->plainTextToken;

    event(new Registered($usuario));

    auth()->login($usuario);

    $usuario->sendEmailVerificationNotification();

    return response()->json([
        'message' => 'Usuario registrado exitosamente',
        'token' => $token
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

    $usuario->load(['rematador', 'cliente', 'casaRemate']);

    // Determinar el rol actual
    $rol = 'cliente'; // valor por defecto
    if ($usuario->rematador) {
        $rol = 'rematador';
    } else if ($usuario->casaRemate) {
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


}