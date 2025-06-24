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

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Sesión cerrada con éxito.']);
    }

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
