<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Rematador;
use App\Models\Usuario;
use Illuminate\Support\Facades\Log;
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

    public function create() {}

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
     *     @OA\Response(response=201, description="Rematador creado exitosamente")
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

        $rematador = Rematador::create([
            'usuario_id' => $usuario->id,
            'matricula' => $validated['matricula'],
        ]);

        $rematador->load('usuario');
        return response()->json($rematador, 201);
    }

    public function show($usuario_id)
    {
        $rematador = Rematador::with(['usuario', 'subastas', 'casasRemate'])
            ->where('usuario_id', $usuario_id)
            ->first();

        if (!$rematador) {
            return response()->json(['error' => 'Rematador no encontrado'], 404);
        }
        return response()->json($rematador);
    }

    public function edit(string $id) {}

    public function update(Request $request, string $usuario_id)
    {
        $rematador = Rematador::where('usuario_id', $usuario_id)->first();

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
            'matricula' => 'sometimes|string|unique:rematadores,matricula,' . $rematador->id,
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

        $usuario->update([
            'nombre' => $validated['nombre'] ?? $usuario->nombre,
            'cedula' => $validated['cedula'] ?? $usuario->cedula,
            'email' => $validated['email'] ?? $usuario->email,
            'telefono' => $validated['telefono'] ?? $usuario->telefono,
            'imagen' => $imagenPath,
            'latitud' => $validated['latitud'] ?? $usuario->latitud,
            'longitud' => $validated['longitud'] ?? $usuario->longitud,
        ]);

        $rematador->update([
            'matricula' => $validated['matricula'] ?? $rematador->matricula,
        ]);

        $rematador->load('usuario');
         return response()->json($rematador);
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

    public function destroy(string $usuario_id)
    {
        $rematador = Rematador::where('usuario_id', $usuario_id)->first();

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
