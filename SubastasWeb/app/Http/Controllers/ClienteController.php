<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Cliente;
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
         $clientes = Cliente::with('direccion')->get();
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
     *             required={"nombre", "cedula", "email"},
     *             @OA\Property(property="nombre", type="string"),
     *             @OA\Property(property="cedula", type="string"),
     *             @OA\Property(property="email", type="string"),
     *             @OA\Property(property="telefono", type="string"),
     *             @OA\Property(property="imagen", type="string"),
     *             @OA\Property(property="calificacion", type="number"),
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Cliente creado exitosamente"
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
            // otros campos de usuario si los tienes
        ]);

        // 1. Crear el usuario
        $usuario = \App\Models\Usuario::create([
            'nombre' => $validated['nombre'],
            'cedula' => $validated['cedula'],
            'email' => $validated['email'],
            'telefono' => $validated['telefono'] ?? null,
            'imagen' => $validated['imagen'] ?? null,
            'contrasenia' => bcrypt('password123'), // O usa un valor real
            'direccionFiscal' => '', // O el valor correspondiente
        ]);

        // 2. Crear el cliente asociado
        $cliente = \App\Models\Cliente::create([
            'usuario_id' => $usuario->id,
            'calificacion' => $validated['calificacion'] ?? null,
        ]);

        // 3. Puedes retornar el cliente con los datos del usuario
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
    public function show(string $id)
    {
       $cliente = Cliente::with(['direccion', 'pujas', 'notificaciones'])->find($id); // el with es para cargar las relaciones
        // $cliente = Cliente::find($id); // sin relaciones

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

        $validated = $request->validate([
            'nombre' => 'sometimes|string|max:255',
            'cedula' => 'sometimes|string|unique:usuarios,cedula,' . $id,
            'email' => 'sometimes|email|unique:usuarios,email,' . $id,
            'telefono' => 'nullable|string',
            'imagen' => 'nullable|string',
            'calificacion' => 'nullable|numeric',
            'notificaciones' => 'nullable|array', // el array de notificaciones lo habiamos eliminado no?
        ]);

        $cliente->update($validated);

        return response()->json($cliente, 200);
    }

    /**
     * @OA\Delete(
     *     path="/api/clientes/{id}",
     *     summary="Eliminar un cliente por ID",
     *     tags={"Clientes"},
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

        if (!$cliente) {
            return response()->json(['error' => 'Cliente no encontrado'], 404);
        }

        $cliente->delete();

        return response()->json(['message' => 'Cliente eliminado con éxito'], 200);
    }
}
