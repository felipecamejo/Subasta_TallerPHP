<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\Usuario;
use App\Models\Cliente;
use App\Models\Rematador;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;

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
        'tipo' => 'required|in:cliente,rematador',
        'matricula' => 'required_if:tipo,rematador|string|nullable',
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
    } else {
        $usuario->rematador()->create([
            'matricula' => $request->matricula
        ]);
    }

    $token = $usuario->createToken('token-personal')->plainTextToken;

    return response()->json([
        'message' => 'Usuario registrado exitosamente',
        'token' => $token
    ], 201);
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

    $usuario->load(['rematador', 'cliente']);

    // Determinar el rol actual
    $rol = $usuario->rematador ? 'rematador' : 'cliente';

    return response()->json([
        'access_token' => $token,
        'token_type' => 'Bearer',
        'usuario_id' => $usuario->id,
        'rol' => $rol,
        'usuario' => $usuario,
    ]);
}


}