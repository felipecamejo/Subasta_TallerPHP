<?php

namespace App\Http\Controllers;

use App\Models\Puja;
use App\Models\Lote;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Http;

/**
 * @OA\Tag(
 *     name="Puja",
 *     description="API para gestionar Pujas"
 * )
*/

class PujaController extends Controller
{
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
     *                 @OA\Property(property="monto", type="number", format="float"),
     *                 @OA\Property(
     *                     property="cliente",
     *                     type="object",
     *                     @OA\Property(property="id", type="integer"),
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
            $pujas = Puja::with(['cliente.valoracion', 'cliente.usuario', 'lote', 'factura'])->get();
            return response()->json($pujas);
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
     *             required={"fechaHora", "monto", "lote_id"},
     *             @OA\Property(property="fechaHora", type="string", format="date-time", example="2025-05-26T14:00:00Z"),
     *             @OA\Property(property="monto", type="number", format="float", example=1500.50),
     *             @OA\Property(property="cliente_id", type="integer", example=1, nullable=true),
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
        $request->validate( [
            'fechaHora' => 'required|date',
            'monto' => 'required|numeric',
            'cliente_id' => 'nullable|exists:clientes,usuario_id',
            'lote_id' => 'required|exists:lotes,id',
        ]);


        try {
            $puja = Puja::create([
                'fechaHora' => $request->fechaHora,
                'monto' => $request->monto,
                'cliente_id' => $request->cliente_id,
                'lote_id' => $request->lote_id,
            ]);

            $puja->load(['cliente.usuario', 'cliente.valoracion', 'lote', 'factura']);

            // Notificar al WebSocket sobre la nueva puja
            $this->notifyWebSocket($puja);

            return response()->json($puja, 201);
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

            $visited = []; 
            $dto = $puja; 

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
     *             @OA\Property(property="monto", type="number", format="float"),
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
            'monto' => 'sometimes|required|numeric',
            'montoTotal' => 'sometimes|required|numeric',
            'cliente_id' => 'nullable|exists:clientes,usuario_id',
            'lote_id' => 'nullable|exists:lotes,id',
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
                'monto',
                'cliente_id',
                'lote_id',
                'factura_id',
            ]);

            $puja->fill($updateData);

            $puja->save();

            $puja->load(['cliente', 'lote', 'factura']);

            $visited = []; 
            $dto = $puja;

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

    /**
     * Notifica al WebSocket server sobre una nueva puja
     */
    private function notifyWebSocket($puja)
    {
        try {
            // Asegurar que tenemos las relaciones cargadas
            $puja->load(['lote.subasta', 'cliente.usuario']);
            
            // Obtener la subasta asociada al lote
            $lote = $puja->lote;
            $subasta = $lote ? $lote->subasta : null;
            
            if (!$subasta) {
                \Log::error('No se pudo encontrar la subasta para la puja: ' . $puja->id);
                return;
            }
            
            // Obtener información del usuario
            $cliente = $puja->cliente;
            $usuario = $cliente ? $cliente->usuario : null;
            
            $bidData = [
                'auctionId' => $subasta->id,
                'bidData' => [
                    'userId' => $cliente ? $cliente->usuario_id : null,
                    'userName' => $usuario ? $usuario->nombre : 'Usuario Anónimo',
                    'bidAmount' => $puja->monto,
                    'timestamp' => $puja->fechaHora,
                    'loteId' => $puja->lote_id,
                    'pujaId' => $puja->id
                ]
            ];

            // Enviar notificación al WebSocket server
            Http::timeout(5)->post('http://localhost:3001/api/notify-bid', $bidData);
            
        } catch (\Exception $e) {
            // Log error but don't fail the puja creation
            \Log::error('Error notificando WebSocket: ' . $e->getMessage());
        }
    }

}
