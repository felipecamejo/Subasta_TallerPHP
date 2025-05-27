<?php
namespace App\Http\Controllers;

use App\Models\Vendedor;
use Illuminate\Http\Request;
use OpenApi\Annotations as OA;
use Illuminate\Support\Facades\Validator;
use App\Mappers\Mapper;

/**
 * @OA\Tag(
 *     name="Vendedores",
 *     description="API para gestionar vendedores"
 * )
 */
class VendedorController extends Controller
{
    protected array $visited = [];
    protected int $maxDepth = 3;

    /**
     * @OA\Get(
     *     path="/api/vendedores",
     *     summary="Lista todos los vendedores",
     *     tags={"Vendedores"},
     *     @OA\Response(
     *         response=200,
     *         description="Lista de vendedores",
     *         @OA\JsonContent(
     *             type="array",
     *             @OA\Items(
     *                 type="object",
     *                 @OA\Property(property="id", type="integer", example=1),
     *                 @OA\Property(property="nombre", type="string", example="Juan Pérez"),
     *                 @OA\Property(property="facturas", type="array", @OA\Items(type="object")),
     *                 @OA\Property(property="articulos", type="array", @OA\Items(type="object")),
     *                 @OA\Property(property="casaRemate", type="array", @OA\Items(type="object"))
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Error del servidor",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="error", type="string", example="Error al obtener vendedores"),
     *             @OA\Property(property="message", type="string", example="Detalle del error")
     *         )
     *     )
     * )
     */
    public function index()
    {
        try {
            $vendedores = Vendedor::with(['facturas', 'articulos', 'casaRemate'])->get();
            $dtoVendedores = $vendedores->map(fn($vendedor) => Mapper::fromModelVendedor($vendedor));
            return response()->json($dtoVendedores, 200);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'Error al obtener vendedores',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/api/vendedores/{id}",
     *     summary="Obtener vendedor por ID",
     *     tags={"Vendedores"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="ID del vendedor",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Vendedor encontrado",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="id", type="integer", example=1),
     *             @OA\Property(property="nombre", type="string", example="Juan Pérez"),
     *             @OA\Property(
     *                 property="facturas",
     *                 type="array",
     *                 @OA\Items(
     *                     type="object",
     *                     @OA\Property(property="id", type="integer", example=10),
     *                     @OA\Property(property="monto", type="number", format="float", example=1500.75)
     *                 )
     *             ),
     *             @OA\Property(
     *                 property="articulos",
     *                 type="array",
     *                 @OA\Items(
     *                     type="object",
     *                     @OA\Property(property="id", type="integer", example=5),
     *                     @OA\Property(property="nombre", type="string", example="Silla"),
     *                     @OA\Property(property="precio", type="number", format="float", example=200.00)
     *                 )
     *             ),
     *             @OA\Property(
     *                 property="casaRemate",
     *                 type="array",
     *                 @OA\Items(
     *                     type="object",
     *                     @OA\Property(property="id", type="integer", example=3),
     *                     @OA\Property(property="nombre", type="string", example="Casa Remate XYZ")
     *                 )
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Vendedor no encontrado",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="error", type="string", example="Vendedor no encontrado")
     *         )
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Error interno",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="error", type="string", example="Error al obtener vendedor"),
     *             @OA\Property(property="message", type="string", example="Detalles del error")
     *         )
     *     )
     * )
     */
    public function show(int $id)
    {
        try {
            $vendedor = Vendedor::with(['facturas', 'articulos', 'casaRemate'])->find($id);
            if (!$vendedor) {
                return response()->json(['error' => 'Vendedor no encontrado'], 404);
            }
            $dtoVendedor = Mapper::fromModelVendedor($vendedor);
            return response()->json($dtoVendedor, 200);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'Error al obtener vendedor',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Post(
     *     path="/api/vendedores",
     *     summary="Crear un nuevo vendedor",
     *     tags={"Vendedores"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"nombre"},
     *             @OA\Property(property="nombre", type="string")
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Vendedor creado exitosamente"
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
            'nombre' => 'required|string|max:255'
        ]);
        $vendedor = Vendedor::create($validated);
        return response()->json($vendedor, 201);
    }

    /**
     * @OA\Put(
     *     path="/api/vendedores/{vendedor}",
     *     summary="Actualizar un vendedor",
     *     tags={"Vendedores"},
     *     @OA\Parameter(
     *         name="vendedor",
     *         in="path",
     *         description="ID del vendedor a actualizar",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"nombre"},
     *             @OA\Property(property="nombre", type="string")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Vendedor actualizado correctamente"),
     *     @OA\Response(response=404, description="Vendedor no encontrado")
     * )
     */
    public function update(Request $request, String $id)
    {
        $vendedor = Vendedor::find($id);
        if (!$vendedor) {
            return response()->json(['error' => 'Vendedor no encontrado'], 404);
        }
        $validated = $request->validate([
            'nombre' => 'sometimes|string|max:255'
        ]);
        $vendedor->update([
            'nombre' => $validated['nombre'] ?? $vendedor->nombre
        ]);
        return response()->json($vendedor, 200);
    }

    /**
     * @OA\Delete(
     *     path="/api/vendedores/{id}",
     *     summary="Eliminar un vendedor por ID",
     *     tags={"Vendedores"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="ID del vendedor a eliminar",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Vendedor eliminado correctamente"
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Vendedor no encontrado"
     *     )
     * )
     */
    public function destroy(String $id)
    {
        $vendedor = Vendedor::find($id);
        if (!$vendedor) {
            return response()->json(['Error' => "Vendedor no encontrado. id: $id"], 404);
        }
        $vendedor->delete();
        return response()->json(['Mensaje' => "Vendedor eliminado correctamente. id: $id"], 200);
    }
}