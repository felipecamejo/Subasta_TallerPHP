<?php

namespace App\Http\Controllers;

use App\Models\Puja;
use App\Models\Lote;
use App\Models\Cliente;
use App\Jobs\ProcesarPuja;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Log;

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
        Log::info('=== INICIO CREACION PUJA (COLA) ===');
        Log::info('Datos recibidos:', $request->all());

        try {
            // Validación de datos
            $request->validate([
                'fechaHora' => 'required|date',
                'monto' => 'required|numeric|min:1',
                'cliente_id' => 'nullable|exists:usuarios,id',
                'lote_id' => 'required|exists:lotes,id',
            ]);

            Log::info('Validación pasada exitosamente');

            // Rate limiting por usuario para evitar spam de pujas
            $userId = $request->cliente_id ?? 'anonymous';
            $rateLimitKey = "puja_rate_limit:{$userId}";
            
            if (RateLimiter::tooManyAttempts($rateLimitKey, 10)) {
                $seconds = RateLimiter::availableIn($rateLimitKey);
                return response()->json([
                    'error' => 'Demasiadas pujas en poco tiempo',
                    'retry_after' => $seconds
                ], 429);
            }
            
            RateLimiter::hit($rateLimitKey, 60); // 10 pujas por minuto máximo

            // Verificar que el lote existe y está en subasta activa
            $lote = Lote::with('subasta')->find($request->lote_id);
            if (!$lote || !$lote->subasta) {
                return response()->json([
                    'error' => 'Lote no encontrado o sin subasta asociada'
                ], 404);
            }

            // Verificar que la subasta está activa
            if (!$lote->subasta->activa) {
                return response()->json([
                    'error' => 'La subasta no está activa en este momento'
                ], 400);
            }

            // Verificar monto mínimo
            $ultimaPuja = $this->obtenerUltimaPujaRedis($request->lote_id);
            $montoMinimo = $ultimaPuja ? $ultimaPuja + $lote->pujaMinima : $lote->valorBase;
            
            if ($request->monto < $montoMinimo) {
                return response()->json([
                    'error' => 'El monto debe ser mayor a ' . $montoMinimo,
                    'monto_minimo' => $montoMinimo,
                    'ultima_puja' => $ultimaPuja
                ], 400);
            }

            // Si se proporciona un cliente_id, asegurar que existe
            if ($request->cliente_id) {
                $this->ensureClienteExists($request->cliente_id);
            }

            // Preparar datos para la cola
            $pujaData = [
                'fechaHora' => $request->fechaHora,
                'monto' => $request->monto,
                'cliente_id' => $request->cliente_id,
                'lote_id' => $request->lote_id,
            ];

            // Despachar job a la cola específica del lote (FIFO por lote)
            ProcesarPuja::dispatch($pujaData, $request->lote_id);

            Log::info("📋 Puja enviada a cola para lote {$request->lote_id}");

            // Respuesta inmediata al cliente
            return response()->json([
                'message' => 'Puja recibida y será procesada',
                'lote_id' => $request->lote_id,
                'monto' => $request->monto,
                'status' => 'queued',
                'estimated_processing_time' => '1-3 segundos'
            ], 202); // 202 Accepted

            \Log::info('Puja creada con ID: ' . $puja->id);

            $puja->load(['cliente.usuario', 'cliente.valoracion', 'lote', 'factura']);
            \Log::info('Relaciones cargadas exitosamente');

            // Notificar al WebSocket sobre la nueva puja (no fallar si esto falla)
            try {
                \Log::info('Intentando notificar WebSocket');
                $this->notifyWebSocket($puja);
                \Log::info('WebSocket notificado exitosamente');
            } catch (\Exception $wsError) {
                \Log::error('Error en WebSocket notification: ' . $wsError->getMessage());
                // Continuar sin fallar la creación de la puja
            }

            \Log::info('=== PUJA CREADA EXITOSAMENTE ===');
            return response()->json($puja, 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Error de validación:', $e->errors());
            return response()->json([
                'error' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Throwable $e) {
            Log::error('=== ERROR PROCESANDO SOLICITUD PUJA ===');
            Log::error('Error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'error' => 'Error interno del servidor',
                'message' => config('app.debug') ? $e->getMessage() : 'Error procesando la puja'
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

            return response()->json($puja);
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

            return response()->json($puja);
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
                Log::error('No se pudo encontrar la subasta para la puja: ' . $puja->id);
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
            Log::error('Error notificando WebSocket: ' . $e->getMessage());
        }
    }

    /**
     * Obtener la última puja de un lote desde Redis (cache rápido)
     */
    private function obtenerUltimaPujaRedis(int $loteId): ?float
    {
        try {
            $stats = Redis::hGetAll("lote_stats_{$loteId}");
            if (isset($stats['ultima_puja'])) {
                return (float) $stats['ultima_puja'];
            }
            
            // Fallback: buscar en base de datos
            $ultimaPuja = Puja::where('lote_id', $loteId)
                             ->orderBy('fechaHora', 'desc')
                             ->first();
            
            return $ultimaPuja ? $ultimaPuja->monto : null;
        } catch (\Exception $e) {
            Log::error("Error obteniendo última puja para lote {$loteId}: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Obtener estadísticas de pujas por lote desde Redis
     */
    public function estadisticasLote($loteId)
    {
        try {
            $cacheKey = "ultima_puja_lote_{$loteId}";
            $ultimaPuja = Redis::get($cacheKey);
            
            $stats = [
                'lote_id' => $loteId,
                'ultima_puja' => $ultimaPuja ? json_decode($ultimaPuja, true) : null,
                'total_pujas_bd' => Puja::where('lote_id', $loteId)->count(),
                'monto_maximo' => Puja::where('lote_id', $loteId)->max('monto'),
                'timestamp' => now()->toISOString()
            ];

            return response()->json($stats);
        } catch (\Exception $e) {
            Log::error('Error obteniendo estadísticas: ' . $e->getMessage());
            return response()->json(['error' => 'Error obteniendo estadísticas'], 500);
        }
    }

    /**
     * Asegurar que existe un registro de cliente para el usuario
     */
    private function ensureClienteExists($usuarioId)
    {
        try {
            Log::info('Buscando cliente con usuario_id: ' . $usuarioId);
            $cliente = \App\Models\Cliente::where('usuario_id', $usuarioId)->first();
            
            if (!$cliente) {
                Log::info('Cliente no encontrado, creando nuevo registro');
                // Crear el registro de cliente si no existe
                $cliente = \App\Models\Cliente::create([
                    'usuario_id' => $usuarioId,
                    'calificacion' => null
                ]);
                
                Log::info('Cliente creado automáticamente para usuario_id: ' . $usuarioId . ' con ID: ' . $cliente->usuario_id);
            } else {
                Log::info('Cliente encontrado: ' . $cliente->usuario_id);
            }
            
            return $cliente;
        } catch (\Exception $e) {
            Log::error('Error en ensureClienteExists: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            throw $e;
        }
    }

}
