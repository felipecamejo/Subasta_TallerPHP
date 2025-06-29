<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Cliente;
use App\Models\Usuario;
use Illuminate\Support\Facades\Log;
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
            $clientes = Cliente::with(['usuario'])->get();
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

        $cliente->load(['usuario']);
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
        $cliente = Cliente::with(['usuario', 'pujas' => function($query) {
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
     * Update the specified resource in storage.
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

        // Procesar imagen si se envió una
        $imagenPath = $usuario->imagen; // Mantener la imagen actual por defecto
        if (array_key_exists('imagen', $validated)) {
            if (empty($validated['imagen'])) {
                // Si se envía imagen vacía, usar imagen por defecto
                $imagenPath = null;
            } else {
                // Si es una imagen Base64, procesarla
                $imagenPath = $this->procesarImagenBase64($validated['imagen'], $usuario_id);
            }
        }

        // Actualizar usuario
        $usuario->update([
            'nombre' => $validated['nombre'] ?? $usuario->nombre,
            'cedula' => $validated['cedula'] ?? $usuario->cedula,
            'email' => $validated['email'] ?? $usuario->email,
            'telefono' => $validated['telefono'] ?? $usuario->telefono,
            'imagen' => $imagenPath,
            'latitud' => $validated['latitud'] ?? $usuario->latitud,
            'longitud' => $validated['longitud'] ?? $usuario->longitud,
        ]);

        // Actualizar cliente (ya no hay campo calificacion)
        $cliente->load(['usuario']);
        return response()->json($cliente);
    }

    /**
     * Procesa una imagen en formato Base64 y la guarda como archivo
     */
    private function procesarImagenBase64($imagenBase64, $usuarioId)
    {
        try {
            // Verificar si es realmente una imagen Base64
            if (strpos($imagenBase64, 'data:image/') !== 0) {
                // Si no es Base64, asumir que es una URL y mantenerla
                return $imagenBase64;
            }

            // Extraer el tipo de imagen y los datos
            $data = explode(',', $imagenBase64);
            if (count($data) !== 2) {
                throw new \Exception('Formato de imagen Base64 inválido');
            }

            $header = $data[0];
            $imageData = base64_decode($data[1]);

            if ($imageData === false) {
                throw new \Exception('Error al decodificar imagen Base64');
            }

            // Extraer extensión del header
            preg_match('/data:image\/([a-zA-Z0-9]+);/', $header, $matches);
            if (!isset($matches[1])) {
                throw new \Exception('Tipo de imagen no válido');
            }
            
            $extension = $matches[1];
            if (!in_array($extension, ['jpeg', 'jpg', 'png', 'gif', 'webp'])) {
                throw new \Exception('Tipo de imagen no soportado');
            }

            // Crear directorio si no existe
            $uploadDir = public_path('uploads/avatars');
            if (!file_exists($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }

            // Generar nombre único para el archivo
            $fileName = 'avatar_' . $usuarioId . '_' . time() . '.' . $extension;
            $filePath = $uploadDir . '/' . $fileName;

            // Guardar archivo
            if (file_put_contents($filePath, $imageData) === false) {
                throw new \Exception('Error al guardar la imagen');
            }

            // Retornar la URL relativa
            return '/uploads/avatars/' . $fileName;

        } catch (\Exception $e) {
            // En caso de error, mantener la imagen actual o usar null
            Log::error('Error procesando imagen Base64: ' . $e->getMessage());
            return null;
        }
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

    /**
     * Buscar el email de un usuario por su id
     * @OA\Get(
     *     path="/api/usuarioEmail/{id}",
     *     summary="Buscar email de usuario por id",
     *     tags={"Cliente"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="ID de usuario a buscar",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Email encontrado"),
     *     @OA\Response(response=404, description="Usuario no encontrado")
     * )
     */
    public function buscarUsuarioPorId($id)
    {
        $usuario = Usuario::find($id);
        if (!$usuario) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }
        // Devolver el email como string plano, sin comillas extra ni JSON
        return response($usuario->email, 200)->header('Content-Type', 'text/plain');
    }
}
