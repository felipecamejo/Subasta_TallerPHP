<?php

namespace App\Http\Controllers;

use App\Models\Puja;
use App\Models\Lote;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Mappers\Mapper;

/**
 * @OA\Tag(
 *     name="Puja",
 *     description="API para gestionar Pujas"
 * )
*/

class PujaController extends Controller
{
    protected array $visited = [];
    protected int $maxDepth = 3;

        /**
     * @OA\Get(
     *     path="/api/pujas",
     *     summary="Obtener todas las pujas",
     *     tags={"Pujas"},
     *     @OA\Response(
     *         response=200,
     *         description="Listado de pujas",
     *         @OA\JsonContent(
     *             type="array",
     *             @OA\Items(
     *                 type="object",
     *                 @OA\Property(property="id", type="integer"),
     *                 @OA\Property(property="fechaHora", type="string", format="date-time"),
     *                 @OA\Property(property="montoTotal", type="number", format="float"),
     *                 @OA\Property(
     *                     property="cliente",
     *                     type="object",
     *                     @OA\Property(property="id", type="integer"),
     *                     @OA\Property(property="calificacion", type="number"),
     *                     @OA\Property(property="usuario", type="object",
     *                         @OA\Property(property="id", type="integer"),
     *                         @OA\Property(property="nombre", type="string")
     *                     )
     *                 ),
     *                 @OA\Property(
     *                     property="lote",
     *                     type="object",
     *                     @OA\Property(property="id", type="integer"),
     *                     @OA\Property(property="valorBase", type="number"),
     *                     @OA\Property(property="pujaMinima", type="number")
     *                 ),
     *                 @OA\Property(
     *                     property="factura",
     *                     type="object",
     *                     @OA\Property(property="id", type="integer"),
     *                     @OA\Property(property="montoTotal", type="number")
     *                 )
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Error del servidor",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="error", type="string"),
     *             @OA\Property(property="trace", type="string")
     *         )
     *     )
     * )
     */
    public function index()
    {
        try {
            $pujas = Puja::with(['cliente', 'lote', 'factura'])->get();

            $dtos = $pujas->map(function ($puja) {
                return Mapper::fromModelPuja($puja, $this->visited, $this->maxDepth);
            });

            return response()->json($dtos);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }



        /**
     * @OA\Post(
     *     path="/api/pujas",
     *     summary="Crear una nueva puja",
     *     tags={"Pujas"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"fechaHora", "montoTotal", "cliente_id", "lote_id"},
     *             @OA\Property(property="fechaHora", type="string", format="date-time", example="2025-05-26T14:00:00Z"),
     *             @OA\Property(property="montoTotal", type="number", format="float", example=1500.50),
     *             @OA\Property(property="cliente_id", type="integer", example=1),
     *             @OA\Property(property="lote_id", type="integer", example=2)
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Puja creada exitosamente",
     *         @OA\JsonContent(type="object")
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Errores de validación",
     *         @OA\JsonContent(
     *             @OA\Property(property="errores", type="object")
     *         )
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Error del servidor",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string"),
     *             @OA\Property(property="message", type="string")
     *         )
     *     )
     * )
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'fechaHora' => 'required|date',
            'montoTotal' => 'required|numeric',
            'cliente_id' => 'required|exists:clientes,id',
            'lote_id' => 'required|exists:lotes,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errores' => $validator->errors()
            ], 422);
        }

        try {
            $puja = Puja::create([
                'fechaHora' => $request->fechaHora,
                'monto' => $request->montoTotal,
                'cliente_id' => $request->cliente_id,
                'lote_id' => $request->lote_id,
            ]);

            $puja->load(['cliente', 'lote', 'factura']);

            $dto = Mapper::fromModelPuja($puja, $this->visited, $this->maxDepth);

            return response()->json($dto, 201);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'Error al crear la puja',
                'message' => $e->getMessage()
            ], 500);
        }
    }

        /**
     * @OA\Get(
     *     path="/api/pujas/{id}",
     *     summary="Obtener una puja por su ID",
     *     tags={"Pujas"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID de la puja",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Puja encontrada",
     *         @OA\JsonContent(type="object")
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Puja no encontrada",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string")
     *         )
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Error del servidor",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string"),
     *             @OA\Property(property="message", type="string")
     *         )
     *     )
     * )
     */
    public function show($id)
    {
        try {
            $puja = Puja::with(['cliente', 'lote', 'factura'])->find($id); 

            if (!$puja) {
                return response()->json(['error' => 'Puja no encontrada'], 404);
            }

            $dto = Mapper::fromModelPuja($puja, $this->visited, $this->maxDepth); 

            return response()->json($dto);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'Error al obtener la puja',
                'message' => config('app.debug') ? $e->getMessage() : 'Error interno del servidor'
            ], 500);
        }
    }



        /**
     * @OA\Put(
     *     path="/api/pujas/{id}",
     *     summary="Actualizar una puja por su ID",
     *     tags={"Pujas"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID de la puja",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="fechaHora", type="string", format="date-time"),
     *             @OA\Property(property="montoTotal", type="number", format="float"),
     *             @OA\Property(property="cliente_id", type="integer"),
     *             @OA\Property(property="lote_id", type="integer"),
     *             @OA\Property(property="factura_id", type="integer")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Puja actualizada exitosamente",
     *         @OA\JsonContent(type="object")
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Puja no encontrada",
     *         @OA\JsonContent(@OA\Property(property="error", type="string"))
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Errores de validación",
     *         @OA\JsonContent(@OA\Property(property="errores", type="object"))
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Error del servidor",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string"),
     *             @OA\Property(property="message", type="string")
     *         )
     *     )
     * )
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'fechaHora' => 'sometimes|required|date',
            'montoTotal' => 'sometimes|required|numeric',
            'cliente_id' => 'sometimes|required|exists:clientes,id',
            'lote_id' => 'sometimes|required|exists:lotes,id',
            'factura_id' => 'nullable|exists:facturas,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errores' => $validator->errors()], 422);
        }

        try {
            $puja = Puja::find($id);

            if (!$puja) {
                return response()->json(['error' => 'Puja no encontrada'], 404);
            }

            $updateData = $request->only([
                'fechaHora',
                'cliente_id',
                'lote_id',
                'factura_id',
            ]);
            
            // Map montoTotal to monto for the model
            if ($request->has('montoTotal')) {
                $updateData['monto'] = $request->montoTotal;
            }

            $puja->fill($updateData);

            $puja->save();

            $puja->load(['cliente', 'lote', 'factura']);

            $dto = Mapper::fromModelPuja($puja, $this->visited, $this->maxDepth);

            return response()->json($dto);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'Error al actualizar la puja',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Delete(
     *     path="/api/pujas/{id}",
     *     summary="Eliminar una puja por ID",
     *     tags={"Pujas"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         description="ID de la puja a eliminar",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Puja eliminada correctamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string")
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Puja no encontrada",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string")
     *         )
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Error del servidor",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string"),
     *             @OA\Property(property="message", type="string")
     *         )
     *     )
     * )
     */
    public function destroy($id)
    {
        try {
            $puja = Puja::find($id);

            if (!$puja) {
                return response()->json(['error' => 'Puja no encontrada'], 404);
            }

            $puja->delete();

            return response()->json(['message' => 'Puja eliminada correctamente']);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'Error al eliminar la puja',
                'message' => $e->getMessage()
            ], 500);
        }

    }

}
