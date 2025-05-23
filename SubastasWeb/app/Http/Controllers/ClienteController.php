<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
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
        // Listar todos los clientes con datos de usuario
        $clientes = Cliente::with('usuario')->get();
        return response()->json($clientes, 200);
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
     *             @OA\Property(property="direccionFiscal", type="string"),
     *             @OA\Property(property="contrasenia", type="string"),
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
     *                 @OA\Property(property="direccionFiscal", type="string"),
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
            'direccionFiscal' => 'nullable|string',
        ]);

        // 1. Crear el usuario
        $usuario = Usuario::create([
            'nombre' => $validated['nombre'],
            'cedula' => $validated['cedula'],
            'email' => $validated['email'],
            'telefono' => $validated['telefono'] ?? '',
            'imagen' => $validated['imagen'] ?? null,
            'contrasenia' => bcrypt($validated['contrasenia']),
            'direccionFiscal' => $validated['direccionFiscal'] ?? '',
        ]);

        // 2. Crear el cliente asociado
        $cliente = Cliente::create([
            'usuario_id' => $usuario->id,
            'calificacion' => $validated['calificacion'] ?? null,
        ]);

        $cliente->load('usuario');
        return response()->json($cliente, 201);
    }

     /**
     * @OA\Get(
     *     path="/api/clientes/{id}",
     *     summary="Obtener un cliente por ID",
     *     tags={"Cliente"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="ID del cliente",
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
    public function show($id)
    {
        $cliente = Cliente::with('usuario')->find($id);
        if (!$cliente) {
            return response()->json(['error' => 'Cliente no encontrado'], 404);
        }
        return response()->json($cliente, 200);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * @OA\Put(
     *     path="/api/clientes/{cliente}",
     *     summary="Actualizar un cliente",
     *     tags={"Cliente"},
     *     @OA\Parameter(
     *         name="cliente",
     *         in="path",
     *         description="ID del cliente a actualizar",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"telefono", "imagen", "calificacion", "notificaciones"},
     *             @OA\Property(property="telefono", type="string"),
     *             @OA\Property(property="imagen", type="string"),
     *             @OA\Property(property="calificacion", type="number"),
     *             @OA\Property(property="notificaciones", type="array", @OA\Items(type="string"))
     *         )
     *     ),
     *     @OA\Response(response=200, description="Cliente actualizado correctamente"),
     *     @OA\Response(response=404, description="Cliente no encontrado")
     * )
    */
    public function update(Request $request, string $id)
    {
       $cliente = Cliente::find($id);

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
            'contrasenia' => 'sometimes|string|min:6',
            'direccionFiscal' => 'nullable|string',
        ]);

        // Actualizar usuario
        $usuario->update([
            'nombre' => $validated['nombre'] ?? $usuario->nombre,
            'cedula' => $validated['cedula'] ?? $usuario->cedula,
            'email' => $validated['email'] ?? $usuario->email,
            'telefono' => $validated['telefono'] ?? $usuario->telefono,
            'imagen' => array_key_exists('imagen', $validated) ? $validated['imagen'] : $usuario->imagen,
            'direccionFiscal' => $validated['direccionFiscal'] ?? $usuario->direccionFiscal,
            'contrasenia' => isset($validated['contrasenia']) ? bcrypt($validated['contrasenia']) : $usuario->contrasenia,
        ]);

        // Actualizar cliente
        $cliente->update([
            'calificacion' => $validated['calificacion'] ?? $cliente->calificacion,
        ]);

        $cliente->load('usuario');
        return response()->json($cliente, 200);
    }
 /**
     * @OA\Delete(
     *     path="/api/clientes/{id}",
     *     summary="Eliminar un cliente por ID",
     *     tags={"Cliente"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="ID del cliente a eliminar",
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
    public function destroy(string $id)
    {
         $cliente = Cliente::find($id);
         $usuario = Usuario::find($id);

        if (!$cliente) {
            return response()->json(['error' => 'Cliente no encontrado'], 404);
        }

        $cliente->delete();
        $usuario->delete();

        return response()->json(['message' => 'Cliente eliminado con éxito'], 200);
    }
}
