<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Auth;
use App\Http\Requests\RegisterUsuarioRequest;
use App\Http\Requests\GoogleRegisterRequest;
use App\Http\Requests\RegisterCasaRemateRequest;
use App\Models\Usuario;
use App\Models\Cliente;
use App\Models\Rematador;
use App\Models\CasaRemate;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;
use App\Http\Requests\LoginRequest;
use Google_Client;
use OpenApi\Annotations as OA;

/**
 * @OA\SecurityScheme(
 *     ssecurityScheme="bearerAuth",
 *     type="http",
 *     scheme="bearer"
 * )
 */

/**
 * @OA\Tag(
 *     name="Autenticación",
 *     description="Endpoints para autenticación y registro de usuarios"
 * )
 */
class AuthController extends Controller{

/**
 * @OA\Post(
 *     path="/api/forgot-password",
 *     summary="Enviar enlace para restablecer contraseña",
 *     tags={"Autenticación"},
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(ref="#/components/schemas/ForgotPasswordRequest")
 *     ),
 *     @OA\Response(response=200, description="Enlace de restablecimiento enviado."),
 *     @OA\Response(response=422, description="Email no válido o no registrado."),
 *     @OA\Response(response=500, description="Error al enviar el enlace.")
 * )
 */
    public function enviarLinkReset(Request $request){
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
 *         @OA\JsonContent(ref="#/components/schemas/LoginRequest")
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Login exitoso con token de acceso.",
 *         @OA\JsonContent(ref="#/components/schemas/LoginResponse")
 *     ),
 *     @OA\Response(response=403, description="Email no verificado."),
 *     @OA\Response(response=422, description="Credenciales inválidas.")
 * )
 */
public function login(LoginRequest $request)
{
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
        'rol' => $rol,
        'usuario' => [
            'nombre' => $usuario->nombre,
            'email' => $usuario->email,
            'imagen' => $usuario->imagen,
        ]
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
    public function logout(Request $request){
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Sesión cerrada con éxito.']);
    }
            
/**
 * @OA\Post(
 *     path="/api/register",
 *     summary="Registro de nuevo usuario",
 *     tags={"Autenticación"},
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(ref="#/components/schemas/RegisterUsuarioRequest")
 *     ),
 *     @OA\Response(response=201, description="Registro exitoso. Verifica tu correo."),
 *     @OA\Response(response=422, description="Datos inválidos."),
 *     @OA\Response(response=500, description="Error interno.")
 * )
 */
public function register(RegisterUsuarioRequest $request)
{
    DB::beginTransaction();

    try {
        if ($request->hasFile('imagen')) {
            $imagenPath = $request->file('imagen')->store('perfiles', 'public');
        } else {
            $imagenPath = Arr::random([
                'avatars/default1.png',
                'avatars/default2.png',
                'avatars/default3.png',
                'avatars/default4.png',
            ]);
        }

        $data = $request->validated();
        $usuario = Usuario::create([
            'nombre' => $data['nombre'],
            'email' => $data['email'],
            'telefono' => $data['telefono'],
            'cedula' => $data['cedula'],
            'contrasenia' => Hash::make($data['contrasenia']),
            'latitud' => $data['latitud'],
            'longitud' => $data['longitud'],
            'imagen' => $imagenPath,
        ]);

        $this->asignarRol($usuario, $data['rol'], $data['matricula'] ?? null);

        event(new Registered($usuario));
        DB::commit();

        return response()->json(['message' => 'Registro exitoso. Verifica tu correo.'], 201);

    } catch (\Exception $e) {
        DB::rollBack();
        return response()->json([
            'error' => 'Error al registrar usuario.',
            'details' => $e->getMessage(),
        ], 500);
    }
}

/**
 * @OA\Post(
 *     path="/api/register-google-user",
 *     summary="Registro de cliente o rematador con cuenta de Google",
 *     tags={"Autenticación"},
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(ref="#/components/schemas/GoogleRegisterRequest")
 *     ),
 *     @OA\Response(response=201, description="Registro exitoso con Google."),
 *     @OA\Response(response=422, description="Error de validación."),
 *     @OA\Response(response=500, description="Error al registrar con Google.")
 * )
 */
   public function registerGoogleUser(GoogleRegisterRequest $request) {
    DB::beginTransaction();

    try {
        // Intentar descargar imagen si se proporcionó una URL
        $imagenRuta = null;

        if ($request->has('imagen_url') && !empty($request->imagen_url)) {
            try {
                $contenido = file_get_contents($request->imagen_url);
                $nombreArchivo = 'perfil_' . uniqid() . '.jpg';
                $ruta = storage_path('app/public/imagenes/' . $nombreArchivo);
                file_put_contents($ruta, $contenido);
                $imagenRuta = 'imagenes/' . $nombreArchivo;
            } catch (\Exception $e) {
                // Si falla, usamos una imagen por defecto
                $imagenRuta = 'imagenes/default.jpg';
            }
        } else {
            // Si no vino ninguna URL, también usamos una por defecto
            $imagenRuta = 'imagenes/default.jpg';
        }

        // Crear usuario
        $usuario = Usuario::create([
            'nombre' => $request->nombre,
            'email' => $request->email,
            'telefono' => $request->telefono,
            'cedula' => $request->cedula,
            'google_id' => $request->google_id,
            'latitud' => $request->latitud,
            'longitud' => $request->longitud,
            'imagen' => $imagenRuta,
            'contrasenia' => Hash::make(uniqid()),
            'email_verified_at' => now(),
        ]);

        // Asignar rol
        $this->asignarRol($usuario, $request->rol, $request->matricula ?? null);

        DB::commit();

        return response()->json([
            'access_token' => $usuario->createToken('token-google')->plainTextToken,
            'usuario_id' => $usuario->id,
            'rol' => $request->rol,
        ], 201);

    } catch (\Exception $e) {
        DB::rollBack();
        return response()->json([
            'error' => 'Error al registrar con Google.',
            'details' => $e->getMessage(),
        ], 500);
    }
}

/**
 * @OA\Post(
 *     path="/api/register-google-casa-remate",
 *     summary="Registro de casa de remate con cuenta de Google",
 *     tags={"Autenticación"},
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(ref="#/components/schemas/GoogleRegisterCasaRemateRequest")
 *     ),
 *     @OA\Response(response=201, description="Registro exitoso con Google."),
 *     @OA\Response(response=422, description="Error de validación."),
 *     @OA\Response(response=500, description="Error al registrar casa de remate.")
 * )
 */
public function registerGoogleCasaRemate(Request $request){
    $request->validate([
        'google_id' => 'required|string|unique:usuarios,google_id',
        'nombre' => 'required|string|max:255',
        'email' => 'required|email|unique:usuarios,email',
        'telefono' => 'required|string',
        
        'latitud' => 'required|numeric',
        'longitud' => 'required|numeric',
        'idFiscal' => 'required|string|unique:casa_remates,idFiscal',
        'imagen_url' => 'nullable|url',
    ]);

    $imagenUrl = $request->imagen_url;

    if ($imagenUrl) {
        try {
            $response = Http::head($imagenUrl);
            $contentType = $response->header('Content-Type');

            if (!$response->ok() || !str_starts_with($contentType, 'image/')) {
                $imagenUrl = null;
            }
        } catch (\Exception $e) {
            $imagenUrl = null;
        }
    }

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
            'imagen' => $imagenUrl ?? Arr::random([
                'avatars/default1.png',
                'avatars/default2.png',
                'avatars/default3.png',
                'avatars/default4.png',
            ]),
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
        return response()->json([
            'error' => 'Error al registrar casa de remate.',
            'details' => $e->getMessage()
        ], 500);
    }
}

/**
 * @OA\Post(
 *     path="/api/register-casa-remate",
 *     summary="Registro de casa de remate",
 *     tags={"Autenticación"},
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(ref="#/components/schemas/RegisterCasaRemateRequest")
 *     ),
 *     @OA\Response(response=201, description="Registro exitoso. Verifica tu correo."),
 *     @OA\Response(response=422, description="Error de validación."),
 *     @OA\Response(response=500, description="Error al registrar casa de remate.")
 * )
 */
 public function registerCasaRemate(RegisterCasaRemateRequest $request)
{
    DB::beginTransaction();

    try {
        $imagen = $request->imagen;

        // Si no viene imagen o está vacía, asignamos una por defecto aleatoria
        if (!$imagen || !is_string($imagen) || trim($imagen) === '') {
            $imagen = Arr::random([
                'avatars/default1.png',
                'avatars/default2.png',
                'avatars/default3.png',
                'avatars/default4.png',
            ]);
        }

        $usuario = Usuario::create([
            'nombre' => $request->nombre,
            'email' => $request->email,
            'telefono' => $request->telefono,
            'cedula' => $request->cedula,
            'latitud' => $request->latitud,
            'longitud' => $request->longitud,
            'contrasenia' => Hash::make($request->contrasenia),
            'imagen' => $imagen,
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
        return response()->json([
            'error' => 'Error al registrar casa de remate.',
            'details' => $e->getMessage()
        ], 500);
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
    public function loginWithGoogle(Request $request){
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

            
    private function determinarRol(Usuario $usuario): ?string{
        if ($usuario->cliente) return 'cliente';
        if ($usuario->rematador) return 'rematador';
        if ($usuario->casaRemate) return 'casa_remate';
        if ($usuario->admin) return 'admin';
            return null;
    }

    private function asignarRol(Usuario $usuario, string $rol, ?string $matricula = null): void{
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
    public function resetearContrasena(Request $request){

        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|string|min:8|confirmed',
            ]);

        $status = Password::reset(
        $request->only('email', 'password', 'password_confirmation', 'token'),
        function ($usuario, $password) {
                
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
    public function reenviarEmailVerificacion(Request $request){
        
        $request->validate([
            'email' => 'required|email|exists:usuarios,email',
        ]);

        $usuario = Usuario::where('email', $request->email)->first();

        if ($usuario->hasVerifiedEmail()) {
            return response()->json(['message' => 'El correo ya está verificado.'], 400);
        }

            
        $usuario->sendEmailVerificationNotification();

        return response()->json(['message' => 'Correo de verificación reenviado.']);
        }

    /**
     * @OA\Get(
     *     path="/api/usuario-autenticado",
     *     summary="Obtener datos del usuario autenticado",
     *     tags={"Autenticación"},
     *     security={{"bearerAuth":{}}}, 
     *     @OA\Response(
     *         response=200,
     *         description="Datos del usuario autenticado",
     *         @OA\JsonContent(
     *             @OA\Property(property="id", type="integer", example=1),
     *             @OA\Property(property="nombre", type="string", example="Pablo De León"),
     *             @OA\Property(property="email", type="string", example="pablonauta@gmail.com"),
     *             @OA\Property(property="rol", type="string", example="admin")
     *         )
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="No autenticado"
     *     )
     * )
     */
    public function usuarioAutenticado(Request $request){

        $usuario = $request->user();

        if (!$usuario) {
            return response()->json(['error' => 'No autenticado.'], 401);
        }

        return response()->json([
            'id' => $usuario->id,
            'nombre' => $usuario->nombre,
            'email' => $usuario->email,
            'rol' => $this->determinarRol($usuario),
        ]);
    }

    

}
