<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Auth;
use App\Models\Usuario;
use App\Models\Cliente;
use App\Models\Rematador;
use App\Models\CasaRemate;
use Google_Client;
use OpenApi\Annotations as OA;

    /**
     * @OA\Tag(
     *     name="Autenticación",
     *     description="Endpoints para autenticación y registro de usuarios"
     * )
     */
    class AuthController extends Controller
    {

    /**
     * @OA\Post(
     *     path="/api/forgot-password",
     *     summary="Enviar enlace para restablecer contraseña",
     *     tags={"Autenticación"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\MediaType(
     *             mediaType="application/json",
     *             @OA\Schema(
     *                 required={"email"},
     *                 @OA\Property(property="email", type="string", example="usuario@ejemplo.com")
     *             )
     *         )
     *     ),
     *     @OA\Response(response=200, description="Enlace de restablecimiento enviado."),
     *     @OA\Response(response=422, description="Email no válido o no registrado."),
     *     @OA\Response(response=500, description="Error al enviar el enlace.")
     * )
     */
public function enviarLinkReset(Request $request)
{
    $request->validate([
        'email' => 'required|email|exists:usuarios,email',
    ]);

    $status = Password::sendResetLink(
        $request->only('email')
    );

    if ($status === Password::RESET_LINK_SENT) {
        return response()->json(['message' => __($status)], 200);
    }

    return response()->json(['error' => __($status)], 500);
}

    /**
     * @OA\Post(
     *     path="/api/login",
     *     summary="Inicio de sesión",
     *     tags={"Autenticación"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\MediaType(
     *             mediaType="application/json",
     *             @OA\Schema(
     *                 required={"email", "password"},
     *                 @OA\Property(property="email", type="string", example="usuario@ejemplo.com"),
     *                 @OA\Property(property="password", type="string", format="password", example="12345678")
     *             )
     *         )
     *     ),
     *     @OA\Response(response=200, description="Login exitoso con token de acceso."),
     *     @OA\Response(response=403, description="Email no verificado."),
     *     @OA\Response(response=422, description="Credenciales inválidas.")
     * )
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string'
        ]);

        $usuario = Usuario::where('email', $request->email)->first();

        if (!$usuario || !Hash::check($request->password, $usuario->contrasenia)) {
            throw ValidationException::withMessages([
                'email' => ['Las credenciales son incorrectas.'],
            ]);
        }

        if (!$usuario->email_verified_at) {
            return response()->json(['message' => 'Email no verificado'], 403);
        }

        $rol = $this->determinarRol($usuario);

        return response()->json([
            'token' => $usuario->createToken('token')->plainTextToken,
            'usuario_id' => $usuario->id,
            'rol' => $rol
        ]);
    }

    /**
     * @OA\Post(
     *     path="/api/logout",
     *     summary="Cerrar sesión",
     *     tags={"Autenticación"},
     *     security={{"bearerAuth": {}}},
     *     @OA\Response(response=200, description="Sesión cerrada con éxito.")
     * )
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Sesión cerrada con éxito.']);
    }
    
    /**
     * @OA\Post(
     *     path="/api/register",
     *     summary="Registro de cliente o rematador",
     *     tags={"Autenticación"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\MediaType(
     *             mediaType="application/json",
     *             @OA\Schema(
     *                 required={"nombre", "email", "telefono", "cedula", "latitud", "longitud", "rol", "contrasenia", "contrasenia_confirmation"},
     *                 @OA\Property(property="nombre", type="string", example="Ana Gómez"),
     *                 @OA\Property(property="email", type="string", example="ana@ejemplo.com"),
     *                 @OA\Property(property="telefono", type="string", example="099123456"),
     *                 @OA\Property(property="cedula", type="string", example="11223344"),
     *                 @OA\Property(property="latitud", type="number", format="float", example=-34.9011),
     *                 @OA\Property(property="longitud", type="number", format="float", example=-56.1645),
     *                 @OA\Property(property="rol", type="string", enum={"cliente", "rematador"}, example="cliente"),
     *                 @OA\Property(property="matricula", type="string", example="MAT456", description="Solo requerido si el rol es rematador"),
     *                 @OA\Property(property="contrasenia", type="string", format="password", example="claveSegura123"),
     *                 @OA\Property(property="contrasenia_confirmation", type="string", format="password", example="claveSegura123")
     *             )
     *         )
     *     ),
     *     @OA\Response(response=201, description="Registro exitoso. Verifica tu correo."),
     *     @OA\Response(response=422, description="Error de validación."),
     *     @OA\Response(response=500, description="Error al registrar el usuario.")
     * )
     */
    public function register(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'email' => 'required|email|unique:usuarios,email',
            'telefono' => 'required|string',
            'cedula' => 'required|string|unique:usuarios,cedula',
            'contrasenia' => 'required|string|min:8|confirmed',
            'latitud' => 'required|numeric',
            'longitud' => 'required|numeric',
            'rol' => 'required|in:cliente,rematador',
        ]);

        DB::beginTransaction();

        try {
            $usuario = Usuario::create([
                'nombre' => $request->nombre,
                'email' => $request->email,
                'telefono' => $request->telefono,
                'cedula' => $request->cedula,
                'contrasenia' => Hash::make($request->contrasenia),
                'latitud' => $request->latitud,
                'longitud' => $request->longitud,
            ]);

            $this->asignarRol($usuario, $request->rol, $request->matricula ?? null);

            event(new Registered($usuario));
            DB::commit();

            return response()->json(['message' => 'Registro exitoso. Verifica tu correo.'], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al registrar usuario.', 'details' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Post(
     *     path="/api/register-google-user",
     *     summary="Registro de cliente o rematador con cuenta de Google",
     *     tags={"Autenticación"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\MediaType(
     *             mediaType="application/json",
     *             @OA\Schema(
     *                 required={"google_id", "nombre", "email", "telefono", "cedula", "latitud", "longitud", "rol"},
     *                 @OA\Property(property="google_id", type="string", example="123456789012345678901"),
     *                 @OA\Property(property="nombre", type="string", example="Juan Pérez"),
     *                 @OA\Property(property="email", type="string", example="juan@gmail.com"),
     *                 @OA\Property(property="telefono", type="string", example="098765432"),
     *                 @OA\Property(property="cedula", type="string", example="45678901"),
     *                 @OA\Property(property="latitud", type="number", format="float", example=-34.9011),
     *                 @OA\Property(property="longitud", type="number", format="float", example=-56.1645),
     *                 @OA\Property(property="rol", type="string", enum={"cliente", "rematador"}, example="cliente"),
     *                 @OA\Property(property="matricula", type="string", example="MAT123", description="Solo requerido si el rol es rematador")
     *             )
     *         )
     *     ),
     *     @OA\Response(response=201, description="Registro exitoso con Google."),
     *     @OA\Response(response=422, description="Error de validación."),
     *     @OA\Response(response=500, description="Error al registrar con Google.")
     * )
     */
    public function registerGoogleUser(Request $request)
    {
        $request->validate([
            'google_id' => 'required|string|unique:usuarios,google_id',
            'nombre' => 'required|string|max:255',
            'email' => 'required|email|unique:usuarios,email',
            'telefono' => 'required|string',
            'cedula' => 'required|string|unique:usuarios,cedula',
            'latitud' => 'required|numeric',
            'longitud' => 'required|numeric',
            'rol' => 'required|in:cliente,rematador',
        ]);

        DB::beginTransaction();

        try {
            $usuario = Usuario::create([
                'nombre' => $request->nombre,
                'email' => $request->email,
                'telefono' => $request->telefono,
                'cedula' => $request->cedula,
                'google_id' => $request->google_id,
                'latitud' => $request->latitud,
                'longitud' => $request->longitud,
                'contrasenia' => Hash::make(uniqid()),
                'email_verified_at' => now(),
            ]);

            $this->asignarRol($usuario, $request->rol, $request->matricula ?? null);

            DB::commit();

            return response()->json([
                'access_token' => $usuario->createToken('token-google')->plainTextToken,
                'usuario_id' => $usuario->id,
                'rol' => $request->rol,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al registrar con Google.', 'details' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Post(
     *     path="/api/register-google-casa-remate",
     *     summary="Registro de casa de remate con cuenta de Google",
     *     tags={"Autenticación"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\MediaType(
     *             mediaType="application/json",
     *             @OA\Schema(
     *                 required={"google_id", "nombre", "email", "telefono", "cedula", "latitud", "longitud", "idFiscal"},
     *                 @OA\Property(property="google_id", type="string", example="123456789012345678901"),
     *                 @OA\Property(property="nombre", type="string", example="Casa de Subastas Google"),
     *                 @OA\Property(property="email", type="string", example="casa@subastas.com"),
     *                 @OA\Property(property="telefono", type="string", example="099123456"),
     *                 @OA\Property(property="cedula", type="string", example="12345678"),
     *                 @OA\Property(property="latitud", type="number", format="float", example=-34.901112),
     *                 @OA\Property(property="longitud", type="number", format="float", example=-56.164532),
     *                 @OA\Property(property="idFiscal", type="string", example="RUT123456789")
     *             )
     *         )
     *     ),
     *     @OA\Response(response=201, description="Registro exitoso con Google."),
     *     @OA\Response(response=422, description="Error de validación."),
     *     @OA\Response(response=500, description="Error al registrar casa de remate.")
     * )
     */
    public function registerGoogleCasaRemate(Request $request)
    {
        $request->validate([
            'google_id' => 'required|string|unique:usuarios,google_id',
            'nombre' => 'required|string|max:255',
            'email' => 'required|email|unique:usuarios,email',
            'telefono' => 'required|string',
            'cedula' => 'required|string|unique:usuarios,cedula',
            'latitud' => 'required|numeric',
            'longitud' => 'required|numeric',
            'idFiscal' => 'required|string|unique:casa_remates,idFiscal',
        ]);

        DB::beginTransaction();

        try {
            $usuario = Usuario::create([
                'nombre' => $request->nombre,
                'email' => $request->email,
                'telefono' => $request->telefono,
                'cedula' => $request->cedula,
                'google_id' => $request->google_id,
                'latitud' => $request->latitud,
                'longitud' => $request->longitud,
                'contrasenia' => Hash::make(uniqid()),
                'email_verified_at' => now(),
            ]);

            CasaRemate::create([
                'usuario_id' => $usuario->id,
                'idFiscal' => $request->idFiscal,
                'activo' => false,
            ]);

            DB::commit();

            return response()->json([
                'access_token' => $usuario->createToken('token-google')->plainTextToken,
                'usuario_id' => $usuario->id,
                'rol' => 'casa_remate',
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al registrar casa de remate.', 'details' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Post(
     *     path="/api/register-casa-remate",
     *     summary="Registro de casa de remate",
     *     tags={"Autenticación"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\MediaType(
     *             mediaType="application/json",
     *             @OA\Schema(
     *                 required={"nombre", "email", "telefono", "cedula", "latitud", "longitud", "idFiscal", "contrasenia", "contrasenia_confirmation"},
     *                 @OA\Property(property="nombre", type="string", example="Casa de Subastas XYZ"),
     *                 @OA\Property(property="email", type="string", example="casa@subastas.com"),
     *                 @OA\Property(property="telefono", type="string", example="099123456"),
     *                 @OA\Property(property="cedula", type="string", example="12345678"),
     *                 @OA\Property(property="latitud", type="number", format="float", example=-34.901112),
     *                 @OA\Property(property="longitud", type="number", format="float", example=-56.164532),
     *                 @OA\Property(property="idFiscal", type="string", example="RUT123456789"),
     *                 @OA\Property(property="contrasenia", type="string", format="password", example="password123"),
     *                 @OA\Property(property="contrasenia_confirmation", type="string", format="password", example="password123")
     *             )
     *         )
     *     ),
     *     @OA\Response(response=201, description="Registro exitoso. Verifica tu correo."),
     *     @OA\Response(response=422, description="Error de validación."),
     *     @OA\Response(response=500, description="Error al registrar casa de remate.")
     * )
     */
    public function registerCasaRemate(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'email' => 'required|email|unique:usuarios,email',
            'telefono' => 'required|string',
            'cedula' => 'required|string|unique:usuarios,cedula',
            'latitud' => 'required|numeric',
            'longitud' => 'required|numeric',
            'idFiscal' => 'required|string|unique:casa_remates,idFiscal',
            'contrasenia' => 'required|string|min:8|confirmed',
        ]);

        DB::beginTransaction();

        try {
            $usuario = Usuario::create([
                'nombre' => $request->nombre,
                'email' => $request->email,
                'telefono' => $request->telefono,
                'cedula' => $request->cedula,
                'latitud' => $request->latitud,
                'longitud' => $request->longitud,
                'contrasenia' => Hash::make($request->contrasenia),
            ]);

            CasaRemate::create([
                'usuario_id' => $usuario->id,
                'idFiscal' => $request->idFiscal,
                'activo' => false,
            ]);

            event(new Registered($usuario));

            DB::commit();

            return response()->json(['message' => 'Registro exitoso. Verifica tu correo.'], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al registrar casa de remate.', 'details' => $e->getMessage()], 500);
        }
    }

    /**
     * @OA\Post(
     *     path="/api/registro/google",
     *     summary="Login con Google",
     *     tags={"Autenticación"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\MediaType(
     *             mediaType="application/json",
     *             @OA\Schema(
     *                 required={"id_token"},
     *                 @OA\Property(property="id_token", type="string", example="GOOGLE_ID_TOKEN")
     *             )
     *         )
     *     ),
     *     @OA\Response(response=200, description="Login exitoso con token de acceso"),
     *     @OA\Response(response=401, description="Token inválido"),
     *     @OA\Response(response=403, description="Email no verificado o rol no permitido"),
     *     @OA\Response(response=404, description="Usuario no encontrado")
     * )
     */
    public function loginWithGoogle(Request $request)
    {
        $request->validate([
            'id_token' => 'required|string',
        ]);

        $client = new Google_Client(['client_id' => env('GOOGLE_CLIENT_ID')]);
        $payload = $client->verifyIdToken($request->id_token);

        if (!$payload) {
            return response()->json(['error' => 'Token inválido'], 401);
        }

        $googleId = $payload['sub'];
        $usuario = Usuario::where('google_id', $googleId)->first();

        if (!$usuario) {
            return response()->json(['error' => 'Usuario no encontrado.'], 404);
        }

        if (!$usuario->email_verified_at) {
            return response()->json(['error' => 'Email no verificado.'], 403);
        }

        $rol = $this->determinarRol($usuario);

        if (!$rol) {
            return response()->json(['error' => 'Rol no válido para login con Google.'], 403);
        }

        return response()->json([
            'access_token' => $usuario->createToken('token-google')->plainTextToken,
            'usuario_id' => $usuario->id,
            'rol' => $rol,
        ]);
    }

    // Métodos auxiliares
    private function determinarRol(Usuario $usuario): ?string
    {
        if ($usuario->cliente) return 'cliente';
        if ($usuario->rematador) return 'rematador';
        if ($usuario->casaRemate) return 'casa_remate';
        if ($usuario->admin) return 'admin';
        return null;
    }

    private function asignarRol(Usuario $usuario, string $rol, ?string $matricula = null): void
    {
        if ($rol === 'cliente') {
            Cliente::create(['usuario_id' => $usuario->id]);
        } elseif ($rol === 'rematador') {
            Rematador::create([
                'usuario_id' => $usuario->id,
                'matricula' => $matricula,
            ]);
        }
    }

 /**
     * @OA\Post(
     *     path="/api/reset-password",
     *     summary="Restablecer contraseña",
     *     tags={"Autenticación"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\MediaType(
     *             mediaType="application/json",
     *             @OA\Schema(
     *                 required={"token", "email", "password", "password_confirmation"},
     *                 @OA\Property(property="token", type="string", example="abcdef123456"),
     *                 @OA\Property(property="email", type="string", example="usuario@ejemplo.com"),
     *                 @OA\Property(property="password", type="string", format="password", example="nuevacontrasena"),
     *                 @OA\Property(property="password_confirmation", type="string", format="password", example="nuevacontrasena")
     *             )
     *         )
     *     ),
     *     @OA\Response(response=200, description="Contraseña restablecida correctamente."),
     *     @OA\Response(response=500, description="Error al restablecer la contraseña."),
     *     @OA\Response(response=422, description="Validación fallida.")
     * )
     */
    public function resetearContrasena(Request $request)
{
    $request->validate([
        'token' => 'required',
        'email' => 'required|email',
        'password' => 'required|string|min:8|confirmed',
    ]);

    $status = Password::reset(
        $request->only('email', 'password', 'password_confirmation', 'token'),
        function ($usuario, $password) {
            // Usar 'contrasenia' como en tu modelo
            $usuario->contrasenia = Hash::make($password);
            $usuario->save();
        }
    );

    if ($status === Password::PASSWORD_RESET) {
        return response()->json(['message' => 'Contraseña restablecida correctamente.']);
    }

    return response()->json(['error' => __($status)], 500);
}
  /**
     * @OA\Post(
     *     path="/api/email/resend",
     *     summary="Reenviar correo de verificación",
     *     tags={"Autenticación"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\MediaType(
     *             mediaType="application/json",
     *             @OA\Schema(
     *                 @OA\Property(property="email", type="string", example="usuario@ejemplo.com")
     *             )
     *         )
     *     ),
     *     @OA\Response(response=200, description="Correo reenviado"),
     *     @OA\Response(response=400, description="Correo ya verificado"),
     *     @OA\Response(response=422, description="Validación fallida")
     * )
     */
public function reenviarEmailVerificacion(Request $request)
{
    $request->validate([
        'email' => 'required|email|exists:usuarios,email',
    ]);

    $usuario = Usuario::where('email', $request->email)->first();

    if ($usuario->hasVerifiedEmail()) {
        return response()->json(['message' => 'El correo ya está verificado.'], 400);
    }

    // Reenvía la notificación
    $usuario->sendEmailVerificationNotification();

    return response()->json(['message' => 'Correo de verificación reenviado.']);
}

}
