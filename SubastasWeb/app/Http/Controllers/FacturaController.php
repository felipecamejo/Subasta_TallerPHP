<?php

namespace App\Http\Controllers;

use App\Models\Factura;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * @OA\Tag(
 *     name="Factura",
 *     description="API para gestionar Facturas"
 * )
*/

class FacturaController extends Controller
{
    

    /**
 * @OA\Get(
 *     path="/api/facturas",
 *     summary="Obtener todas las facturas",
 *     tags={"Facturas"},
 *     @OA\Response(
 *         response=200,
 *         description="Listado de facturas",
 *         @OA\JsonContent(type="array", @OA\Items(type="object"))
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
            $facturas = Factura::with(['vendedor', 'puja'])->get();

            
            $dtos = $facturas->map(function ($factura) {
                return $factura;
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
 *     path="/api/facturas",
 *     summary="Crear una nueva factura",
 *     tags={"Facturas"},
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(
 *             required={"puja_id", "montoTotal", "condicionesDePago", "entrega"},
 *             @OA\Property(property="puja_id", type="integer", example=1),
 *             @OA\Property(property="vendedor_id", type="integer", example=2, nullable=true),
 *             @OA\Property(property="montoTotal", type="number", format="float", example=1500.50),
 *             @OA\Property(property="condicionesDePago", type="string", example="Contado"),
 *             @OA\Property(property="entrega", type="string", example="Inmediata")
 *         )
 *     ),
 *     @OA\Response(response=201, description="Factura creada exitosamente"),
 *     @OA\Response(response=422, description="Datos inválidos"),
 *     @OA\Response(response=500, description="Error del servidor")
 * )
 */
   public function store(Request $request)
{
    \Log::info('📋 FACTURA CONTROLLER: Datos recibidos', $request->all());

    $validator = Validator::make($request->all(), [
        'puja_id' => 'required|exists:pujas,id',
        'vendedor_id' => 'nullable|exists:vendedores,id',
        'montoTotal' => 'required|numeric|min:0',
        'condicionesDePago' => 'required|string',
        'entrega' => 'required|string',
    ]);

    if ($validator->fails()) {
        \Log::error('❌ FACTURA CONTROLLER: Validación fallida', $validator->errors()->toArray());
        return response()->json([
            'errores' => $validator->errors()
        ], 422);
    }

    try {
        // Crear factura usando mass assignment con datos consistentes
        $factura = Factura::create([
            'puja_id' => $request->puja_id,
            'vendedor_id' => $request->vendedor_id,
            'monto_total' => $request->montoTotal,
            'condiciones_de_pago' => $request->condicionesDePago,
            'entrega' => $request->entrega,
        ]);

        \Log::info('✅ FACTURA CONTROLLER: Factura creada exitosamente', ['id' => $factura->id]);

        $factura->load(['puja', 'vendedor']);

        return response()->json($factura, 201);
    } catch (\Throwable $e) {
        \Log::error('❌ FACTURA CONTROLLER: Error al crear factura', [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
            'request_data' => $request->all()
        ]);
        
        return response()->json([
            'error' => 'Error al crear la factura',
            'message' => $e->getMessage()
        ], 500);
    }
}

/**
 * @OA\Get(
 *     path="/api/facturas/{id}",
 *     summary="Obtener una factura por su ID",
 *     tags={"Facturas"},
 *     @OA\Parameter(
 *         name="id",
 *         in="path",
 *         description="ID de la factura",
 *         required=true,
 *         @OA\Schema(type="integer")
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Factura encontrada",
 *         @OA\JsonContent(type="object")
 *     ),
 *     @OA\Response(
 *         response=404,
 *         description="Factura no encontrada",
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
        // Cargar factura con relaciones necesarias, por ejemplo 'puja' y 'vendedor'
        $factura = Factura::with(['puja', 'vendedor'])->find($id);

        if (!$factura) {
            return response()->json(['error' => 'Factura no encontrada'], 404);
        }

        $dto = $factura;

        return response()->json($dto);
    } catch (\Throwable $e) {
        return response()->json([
            'error' => 'Error al obtener la factura',
            'message' => config('app.debug') ? $e->getMessage() : 'Error interno del servidor'
        ], 500);
    }
}


/**
 * @OA\Put(
 *     path="/api/facturas/{id}",
 *     summary="Actualizar una factura existente",
 *     tags={"Facturas"},
 *     @OA\Parameter(
 *         name="id",
 *         in="path",
 *         description="ID de la factura a actualizar",
 *         required=true,
 *         @OA\Schema(type="integer")
 *     ),
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="puja_id", type="integer", nullable=true),
 *             @OA\Property(property="vendedor_id", type="integer", nullable=true),
 *             @OA\Property(property="montoTotal", type="number", format="float"),
 *             @OA\Property(property="condicionesDePago", type="string"),
 *             @OA\Property(property="entrega", type="string")
 *         )
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Factura actualizada correctamente",
 *         @OA\JsonContent(type="object")
 *     ),
 *     @OA\Response(response=404, description="Factura no encontrada"),
 *     @OA\Response(response=422, description="Datos inválidos"),
 *     @OA\Response(response=500, description="Error del servidor")
 * )
 */
  public function update(Request $request, $id)
{
    $validator = Validator::make($request->all(), [
        'puja_id' => 'nullable|exists:pujas,id',
        'vendedor_id' => 'nullable|exists:vendedores,id',
        'montoTotal' => 'sometimes|required|numeric',
        'condicionesDePago' => 'sometimes|required|string',
        'entrega' => 'sometimes|required|string',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'errores' => $validator->errors()
        ], 422);
    }

    try {
        // Busca el modelo Factura (modelo único, no colección)
        $factura = Factura::find($id);

        if (!$factura) {
            return response()->json(['error' => 'Factura no encontrada'], 404);
        }

        // Actualiza solo los campos enviados en la petición
        $factura->fill($request->only([
            'puja_id',
            'vendedor_id',
            'montoTotal',
            'condicionesDePago',
            'entrega',
        ]));

        $factura->save();

        // Carga las relaciones para que el Mapper pueda usarlas (opcional, según tu Mapper)
        $factura->load(['puja', 'vendedor']);

        // Asegúrate que $factura es instancia de Factura, no colección
        if (!($factura instanceof Factura)) {
            return response()->json(['error' => 'Se esperaba un modelo Factura, pero se recibió otro tipo'], 500);
        }

        // Mapea el modelo a DTO
        $dto = $factura;

        return response()->json($dto);
    } catch (\Throwable $e) {
        return response()->json([
            'error' => 'Error al actualizar la factura',
            'message' => $e->getMessage()
        ], 500);
    }
}


    /**
 * @OA\Delete(
 *     path="/api/facturas/{id}",
 *     summary="Eliminar una factura por ID",
 *     tags={"Facturas"},
 *     @OA\Parameter(
 *         name="id",
 *         in="path",
 *         description="ID de la factura a eliminar",
 *         required=true,
 *         @OA\Schema(type="integer")
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Factura eliminada correctamente"
 *     ),
 *     @OA\Response(
 *         response=404,
 *         description="Factura no encontrada"
 *     ),
 *     @OA\Response(
 *         response=500,
 *         description="Error del servidor"
 *     )
 * )
 */
   public function destroy($id)
{
    try {
        $factura = Factura::find($id);

        if (!$factura) {
            return response()->json(['error' => 'Factura no encontrada'], 404);
        }

        $factura->delete();

        return response()->json(['message' => 'Factura eliminada correctamente'], 200);
    } catch (\Throwable $e) {
        return response()->json([
            'error' => 'Error al eliminar la factura',
            'message' => $e->getMessage()
        ], 500);
    }
}
}
