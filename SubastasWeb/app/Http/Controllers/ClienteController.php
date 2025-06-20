<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Cliente;
use App\Models\Usuario;
use OpenApi\Annotations as OA;


/**
 * @OA\Tag(
 *     name="Cliente",
 *     description="API para gestionar clientes"
 * )
*/
class ClienteController extends Controller
{
     /**
     * @OA\Get(
     *     path="/api/clientes",
     *     summary="Obtener todos los clientes",
     *     tags={"Cliente"},
     *     @OA\Response(response=200, description="OK")
     * )
    */
    public function index()
    {
        try {
            $clientes = Cliente::with(['usuario', 'valoracion'])->get();
            return response()->json($clientes, 200);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);

        }
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * @OA\Post(
     *     path="/api/clientes",
     *     summary="Crear un nuevo cliente",
     *     tags={"Cliente"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"nombre", "cedula", "email", "contrasenia"},
     *             @OA\Property(property="nombre", type="string"),
     *             @OA\Property(property="cedula", type="string"),
     *             @OA\Property(property="email", type="string"),
     *             @OA\Property(property="telefono", type="string"),
     *             @OA\Property(property="imagen", type="string"),
     *             @OA\Property(property="calificacion", type="number"),
     *             @OA\Property(property="contrasenia", type="string"),
     *             @OA\Property(property="latitud", type="number"),
     *             @OA\Property(property="longitud", type="number"),
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Cliente creado exitosamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="id", type="integer"),
     *             @OA\Property(property="usuario_id", type="integer"),
     *             @OA\Property(property="calificacion", type="number"),
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
            'calificacion' => 'nullable|numeric',
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

        // 2. Crear el cliente asociado
        $cliente = Cliente::create([
            'usuario_id' => $usuario->id,
        ]);

        $cliente->load(['usuario', 'valoracion']);
        return response()->json($cliente, 201);
    }

     /**
     * @OA\Get(
     *     path="/api/clientes/{usuario_id}",
     *     summary="Obtener un cliente por su usuario_id",
     *     tags={"Cliente"},
     *     @OA\Parameter(
     *         name="usuario_id",
     *         in="path",
     *         description="ID del usuario asociado al cliente",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Cliente encontrado"
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Cliente no encontrado"
     *     )
     * )
    */
    public function show($usuario_id)
    {
        $cliente = Cliente::with(['usuario', 'valoracion', 'pujas' => function($query) {
            $query->with(['lote', 'factura']);
        }, 'notificaciones'])->find($usuario_id);
        
        if (!$cliente) {
            return response()->json(['error' => 'Cliente no encontrado'], 404);
        }

        return response()->json($cliente);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $usuario_id)
    {
        //
    }

    /**
     * @OA\Put(
     *     path="/api/clientes/{usuario_id}",
     *     summary="Actualizar un cliente",
     *     tags={"Cliente"},
     *     @OA\Parameter(
     *         name="usuario_id",
     *         in="path",
     *         description="ID del usuario asociado al cliente a actualizar",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"nombre", "cedula", "email", "contrasenia"},
     *             @OA\Property(property="nombre", type="string"),
     *             @OA\Property(property="cedula", type="string"),
     *             @OA\Property(property="email", type="string"),
     *             @OA\Property(property="telefono", type="string"),
     *             @OA\Property(property="imagen", type="string"),
     *             @OA\Property(property="calificacion", type="number"),
     *             @OA\Property(property="latitud", type="number"),
     *             @OA\Property(property="longitud", type="number"),
     *         )
     *     ),
     *     @OA\Response(response=200, description="Cliente actualizado correctamente"),
     *     @OA\Response(response=404, description="Cliente no encontrado")
     * )
    */
    public function update(Request $request, string $usuario_id)
    {
       $cliente = Cliente::find($usuario_id);

        if (!$cliente) {
            return response()->json(['error' => 'Cliente no encontrado'], 404);
        }

        $usuario = $cliente->usuario;

        $validated = $request->validate([
            'nombre' => 'sometimes|string|max:255',
            'cedula' => 'sometimes|string|unique:usuarios,cedula,' . $usuario->id,
            'email' => 'sometimes|email|unique:usuarios,email,' . $usuario->id,
            'telefono' => 'nullable|string',
            'imagen' => 'nullable|string',
            'calificacion' => 'sometimes|numeric',
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

        // Actualizar cliente (ya no hay campo calificacion)
        $cliente->load(['usuario', 'valoracion']);
        return response()->json($cliente);
    }


 /**
     * @OA\Delete(
     *     path="/api/clientes/{usuario_id}",
     *     summary="Eliminar un cliente por usuario_id",
     *     tags={"Cliente"},
     *     @OA\Parameter(
     *         name="usuario_id",
     *         in="path",
     *         description="ID del usuario asociado al cliente a eliminar",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Cliente eliminado correctamente"
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Cliente no encontrado"
     *     )
     * )
     */
    public function destroy(string $usuario_id)
    {
         $cliente = Cliente::find($usuario_id);

        if (!$cliente) {
            return response()->json(['error' => 'Cliente no encontrado'], 404);
        }
        $usuario = $cliente->usuario;

        $cliente->delete();
        if ($usuario) {
            $usuario->delete();
        }

        return response()->json(['message' => 'Cliente eliminado con éxito'], 200);
    }
}
