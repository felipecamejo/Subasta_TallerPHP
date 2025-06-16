<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Rematador;
use App\Models\Usuario;
use App\Mappers\Mapper;
use OpenApi\Annotations as OA;

/**
 * @OA\Tag(
 *     name="Rematador",
 *     description="API para gestionar rematadores"
 * )
*/
class RematadorController extends Controller
{
    public $maxDepth = 1;
    public $visited = [];

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
                return Mapper::fromModelRematador($rematador, $this->visited, $this->maxDepth);
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
        return response()->json(Mapper::fromModelRematador($rematador, $this->visited, $this->maxDepth), 201);
    }

    public function show($usuario_id)
    {
        $rematador = Rematador::with(['usuario', 'subastas', 'casasRemate'])
            ->where('usuario_id', $usuario_id)
            ->first();

        if (!$rematador) {
            return response()->json(['error' => 'Rematador no encontrado'], 404);
        }

        return response()->json(Mapper::fromModelRematador($rematador, $this->visited, $this->maxDepth));
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

        $usuario->update([
            'nombre' => $validated['nombre'] ?? $usuario->nombre,
            'cedula' => $validated['cedula'] ?? $usuario->cedula,
            'email' => $validated['email'] ?? $usuario->email,
            'telefono' => $validated['telefono'] ?? $usuario->telefono,
            'imagen' => array_key_exists('imagen', $validated) ? $validated['imagen'] : $usuario->imagen,
            'latitud' => $validated['latitud'] ?? $usuario->latitud,
            'longitud' => $validated['longitud'] ?? $usuario->longitud,
        ]);

        $rematador->update([
            'matricula' => $validated['matricula'] ?? $rematador->matricula,
        ]);

        $rematador->load('usuario');
        return response()->json(Mapper::fromModelRematador($rematador, $this->visited, $this->maxDepth));
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
