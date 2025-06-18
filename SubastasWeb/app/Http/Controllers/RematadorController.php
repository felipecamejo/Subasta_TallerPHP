<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Rematador;
use App\Models\Usuario;
use OpenApi\Annotations as OA;

/**
 * @OA\Tag(
 *     name="Rematador",
 *     description="API para gestionar rematadores"
 * )
*/
class RematadorController extends Controller
{

    /**
     * @OA\Get(
     *     path="/api/rematadores",
     *     summary="Obtener todos los rematadores",
     *     tags={"Rematador"},
     *     @OA\Response(response=200, description="OK")
     * )
    */
    public function index()
    {
        try {

            $rematadores = Rematador::with('usuario')->get() ?? collect();
            $dtos = $rematadores->map(function ($rematador) {
                return $rematador;
            });

            return response()->json($dtos, 200);

        } catch (\Throwable $e) {

            return response()->json([
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);

        }
    }

    /**
     * Mostrar formulario para crear (sin implementación).
     */
    public function create()
    {
        //
    }

    /**
     * @OA\Post(
     *     path="/api/rematadores",
     *     summary="Crear un nuevo rematador",
     *     tags={"Rematador"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"nombre", "cedula", "email", "contrasenia"},
     *             @OA\Property(property="nombre", type="string"),
     *             @OA\Property(property="cedula", type="string"),
     *             @OA\Property(property="email", type="string"),
     *             @OA\Property(property="telefono", type="string"),
     *             @OA\Property(property="imagen", type="string"),
     *             @OA\Property(property="matricula", type="string"),
     *             @OA\Property(property="contrasenia", type="string"),
     *             @OA\Property(property="latitud", type="number"),
     *             @OA\Property(property="longitud", type="number"),
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Rematador creado exitosamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="id", type="integer"),
     *             @OA\Property(property="usuario_id", type="integer"),
     *             @OA\Property(property="matricula", type="string"),
     *             @OA\Property(property="created_at", type="string", format="date-time"),
     *             @OA\Property(property="updated_at", type="string", format="date-time"),
     *             @OA\Property(
     *                 property="usuario",
     *                 type="object",
     *                 @OA\Property(property="id", type="integer"),
     *                 @OA\Property(property="nombre", type="string"),
     *                 @OA\Property(property="cedula", type="string"),
     *                 @OA\Property(property="email", type="string"),
     *                 @OA\Property(property="telefono", type="string"),
     *                 @OA\Property(property="imagen", type="string"),
     *                 @OA\Property(property="latitud", type="number"),
     *                 @OA\Property(property="longitud", type="number"),
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Error de validación"
     *     )
     * )
    */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'cedula' => 'required|string|unique:usuarios,cedula',
            'email' => 'required|email|unique:usuarios,email',
            'telefono' => 'nullable|string',
            'imagen' => 'nullable|string',
            'matricula' => 'required|string',
            'contrasenia' => 'required|string',
            'latitud' => 'nullable|numeric',
            'longitud' => 'nullable|numeric',
        ]);

        // 1. Crear el usuario
        $usuario = Usuario::create([
            'nombre' => $validated['nombre'],
            'cedula' => $validated['cedula'],
            'email' => $validated['email'],
            'telefono' => $validated['telefono'] ?? '',
            'imagen' => $validated['imagen'] ?? null,
            'contrasenia' => bcrypt($validated['contrasenia']),
            'latitud' => $validated['latitud'] ?? null,
            'longitud' => $validated['longitud'] ?? null,
        ]);

        // 2. Crear el rematador asociado
        $rematador = Rematador::create([
            'usuario_id' => $usuario->id,
            'matricula' => $validated['matricula'],
        ]);

        $rematador->load('usuario');
        return response()->json($rematador, 201);
    }

    /**
     * @OA\Get(
     *     path="/api/rematadores/{id}",
     *     summary="Obtener un rematador por ID",
     *     tags={"Rematador"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="ID del rematador",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Rematador encontrado"
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Rematador no encontrado"
     *     )
     * )
    */
    public function show($usuario_id)
    {
        $rematador = Rematador::with(['usuario', 'subastas', 'casasRemate'])->find($usuario_id);
        if (!$rematador) {
            return response()->json(['error' => 'Rematador no encontrado'], 404);
        }
        return response()->json($rematador);
    }

    /**
     * Mostrar formulario para editar (sin implementación).
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * @OA\Put(
     *     path="/api/rematadores/{rematador}",
     *     summary="Actualizar un rematador",
     *     tags={"Rematador"},
     *     @OA\Parameter(
     *         name="rematador",
     *         in="path",
     *         description="ID del rematador a actualizar",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *              required={"nombre", "cedula", "email", "matricula"},
     *             @OA\Property(property="nombre", type="string"),
     *             @OA\Property(property="cedula", type="string"),
     *             @OA\Property(property="email", type="string"),
     *             @OA\Property(property="telefono", type="string"),
     *             @OA\Property(property="imagen", type="string"),
     *             @OA\Property(property="matricula", type="string"),
     *             @OA\Property(property="latitud", type="number"),
     *             @OA\Property(property="longitud", type="number"),
     *         )
     *     ),
     *     @OA\Response(response=200, description="Rematador actualizado correctamente"),
     *     @OA\Response(response=404, description="Rematador no encontrado")
     * )
    */
    public function update(Request $request, string $usuario_id)
    {
        $rematador = Rematador::find($usuario_id);

        if (!$rematador) {
            return response()->json(['error' => 'Rematador no encontrado'], 404);
        }

        $usuario = $rematador->usuario;

        $validated = $request->validate([
            'nombre' => 'sometimes|string|max:255',
            'cedula' => 'sometimes|string|unique:usuarios,cedula,' . $usuario->id,
            'email' => 'sometimes|email|unique:usuarios,email,' . $usuario->id,
            'telefono' => 'nullable|string',
            'imagen' => 'nullable|string',
            'matricula' => 'sometimes|string|unique:rematadores,matricula,' . $usuario_id,
            'latitud' => 'nullable|numeric',
            'longitud' => 'nullable|numeric',
        ]);

        // Actualizar usuario
        $usuario->update([
            'nombre' => $validated['nombre'] ?? $usuario->nombre,
            'cedula' => $validated['cedula'] ?? $usuario->cedula,
            'email' => $validated['email'] ?? $usuario->email,
            'telefono' => $validated['telefono'] ?? $usuario->telefono,
            'imagen' => array_key_exists('imagen', $validated) ? $validated['imagen'] : $usuario->imagen,
            'latitud' => $validated['latitud'] ?? $usuario->latitud,
            'longitud' => $validated['longitud'] ?? $usuario->longitud,
        ]);

        // Actualizar rematador
        $rematador->update([
            'matricula' => $validated['matricula'] ?? $rematador->matricula,
        ]);

        $rematador->load('usuario');
         return response()->json($rematador);
    }

    /**
     * @OA\Delete(
     *     path="/api/rematadores/{id}",
     *     summary="Eliminar un rematador por ID",
     *     tags={"Rematador"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="ID del rematador a eliminar",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Rematador eliminado correctamente"
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Rematador no encontrado"
     *     )
     * )
     */
    public function destroy(string $usuario_id)
    {
          $rematador = Rematador::find($usuario_id);

        if (!$rematador) {
            return response()->json(['error' => 'Rematador no encontrado'], 404);
        }
        $usuario = $rematador->usuario;

        $rematador->delete();
        if ($usuario) {
            $usuario->delete();
        }

        return response()->json(['message' => 'Rematador eliminado con éxito'], 200);
    }
}
