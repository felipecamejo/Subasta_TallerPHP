<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Validation\ValidationException;
use App\Models\Usuario;
use App\Models\Cliente;
use App\Models\Rematador;
use App\Models\CasaRemate;
use App\Models\Admin;

class AuthController extends Controller
{

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
        'token' => $usuario->createToken('token')->plainTextToken,
        'usuario_id' => $usuario->id,
        'rol' => $rol
    ]);
}

    /**
     * Registro tradicional de cliente o rematador
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

            if ($request->rol === 'cliente') {
                Cliente::create(['usuario_id' => $usuario->id]);
            } elseif ($request->rol === 'rematador') {
                Rematador::create([
                    'usuario_id' => $usuario->id,
                    'matricula' => $request->matricula ?? null,
                ]);
            }

            event(new Registered($usuario));

            DB::commit();

            return response()->json(['message' => 'Registro exitoso. Verifica tu correo.'], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al registrar usuario.', 'details' => $e->getMessage()], 500);
        }
    }

    /**
     * Registro con Google de cliente o rematador
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
                'contrasenia' => Hash::make($request->contrasenia),
                'email_verified_at' => now(),
            ]);

            if ($request->rol === 'cliente') {
                Cliente::create(['usuario_id' => $usuario->id]);
            } elseif ($request->rol === 'rematador') {
                Rematador::create([
                    'usuario_id' => $usuario->id,
                    'matricula' => $request->matricula ?? null,
                ]);
            }

            DB::commit();

            return response()->json([
                'access_token' => $usuario->createToken('token-google')->plainTextToken,
                'usuario_id' => $usuario->id,
                'rol' => $usuario->rol
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al registrar con Google.', 'details' => $e->getMessage()], 500);
        }
    }

    /**
     * Registro con Google de casa de remate
     */
   public function registerGoogleCasaRemate(Request $request)
{
    \Log::debug('📥 registerGoogleCasaRemate - Request recibido', $request->all());

    try {
        $request->validate([
            'google_id' => 'required|string|unique:usuarios,google_id',
            'nombre' => 'required|string|max:255',
            'email' => 'required|email|unique:usuarios,email',
            'telefono' => 'required|string',
            'cedula' => 'required|string|unique:usuarios,cedula',
            'latitud' => 'required|numeric',
            'longitud' => 'required|numeric',
            'idFiscal' => 'required|string|unique:casa_remates,idFiscal',
            'contrasenia' => 'required|string|min:8',
        ]);
    } catch (\Illuminate\Validation\ValidationException $ve) {
        \Log::error('❌ Validación fallida en registerGoogleCasaRemate', $ve->errors());
        return response()->json(['error' => 'Validación fallida', 'details' => $ve->errors()], 422);
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
            'email_verified_at' => now(),
            'contrasenia' => Hash::make($request->contrasenia), // ✅ AÑADIDO
        ]);

        CasaRemate::create([
            'usuario_id' => $usuario->id,
            'idFiscal' => $request->idFiscal,
            'activo' => false,
        ]);

        DB::commit();

        \Log::info('✅ Casa de remate registrada con éxito', ['usuario_id' => $usuario->id]);

        return response()->json([
            'message' => 'Casa de remate registrada con Google correctamente.',
            'access_token' => $usuario->createToken('token-google')->plainTextToken,
            'usuario_id' => $usuario->id,
            'rol' => 'casa_remate'
        ], 201);
    } catch (\Exception $e) {
        DB::rollBack();
        \Log::error('❌ Error en registerGoogleCasaRemate', ['exception' => $e->getMessage()]);
        return response()->json([
            'error' => 'No se pudo registrar la casa de remate.',
            'details' => $e->getMessage()
        ], 500);
    }
}

}
