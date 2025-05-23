<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;


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
        $rematadores = Rematador::with('direccion')->get();
        return response()->json($rematadores, 200);
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
     *             required={"nombre", "cedula", "email"},
     *             @OA\Property(property="nombre", type="string"),
     *             @OA\Property(property="cedula", type="string"),
     *             @OA\Property(property="email", type="string"),
     *             @OA\Property(property="telefono", type="string"),
     *             @OA\Property(property="imagen", type="string"),
     *             @OA\Property(property="matricula", type="string"),
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Rematador creado exitosamente"
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

        // 2. Crear el rematador asociado
        $rematador = \App\Models\Rematador::create([
            'usuario_id' => $usuario->id,
            'matricula' => $validated['matricula'],
        ]);

        // 3. Puedes retornar el rematador con los datos del usuario
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
    public function show(string $id)
    {
        $rematador = Rematador::with(['direccion', 'subastas', 'casasRemate'])->find($id); // el with es para cargar las relaciones
        // $rematador = Rematador::find($id); // sin relaciones

        if (!$rematador) {
            return response()->json(['error' => 'Rematador no encontrado'], 404);
        }

        return response()->json($rematador, 200);
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
     *         )
     *     ),
     *     @OA\Response(response=200, description="Rematador actualizado correctamente"),
     *     @OA\Response(response=404, description="Rematador no encontrado")
     * )
    */
    public function update(Request $request, string $id)
    {
        $rematador = Rematador::find($id);

        if (!$rematador) {
            return response()->json(['error' => 'Rematador no encontrado'], 404);
        }

        $validated = $request->validate([
            'nombre' => 'sometimes|string|max:255',
            'cedula' => 'sometimes|string|unique:usuarios,cedula,' . $id,
            'email' => 'sometimes|email|unique:usuarios,email,' . $id,
            'telefono' => 'nullable|string',
            'imagen' => 'nullable|string',
            'matricula' => 'sometimes|string|unique:rematadores,matricula,' . $id,
        ]);

        $rematador->update($validated);

        return response()->json($rematador, 200);
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
    public function destroy(string $id)
    {
        $rematador = Rematador::find($id);

        if (!$rematador) {
            return response()->json(['error' => 'Rematador no encontrado'], 404);
        }

        $rematador->delete();

        return response()->json(['message' => 'Rematador eliminado con éxito'], 200);
    }
}
