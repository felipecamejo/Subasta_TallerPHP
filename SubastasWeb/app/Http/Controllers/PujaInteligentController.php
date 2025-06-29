<?php

namespace App\Http\Controllers;

use App\Http\Controllers\PujaController;
use App\Http\Controllers\PujaRedisController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;

/**
 * @OA\Tag(
 *     name="Pujas Inteligentes",
 *     description="Sistema que decide automáticamente usar Redis o PostgreSQL según la carga"
 * )
 */
class PujaInteligentController extends Controller
{
    protected $pujaController;
    protected $pujaRedisController;

    public function __construct()
    {
        $this->pujaController = new PujaController();
        $this->pujaRedisController = new PujaRedisController();
    }

    /**
     * @OA\Post(
     *     path="/api/pujas-inteligente/{loteId}/pujar",
     *     summary="Realizar puja usando el mejor sistema disponible",
     *     tags={"Pujas Inteligentes"},
     *     @OA\Parameter(
     *         name="loteId",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"cliente_id", "monto"},
     *             @OA\Property(property="cliente_id", type="integer"),
     *             @OA\Property(property="monto", type="number", format="float")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Puja procesada exitosamente")
     * )
     */
    public function realizarPujaInteligente(Request $request, $loteId)
    {
        // Decidir qué sistema usar basado en:
        // 1. Si Redis está disponible
        // 2. Carga actual del lote
        // 3. Configuración del sistema

        if ($this->debeUsarRedis($loteId)) {
            return $this->pujaRedisController->realizarPuja($request, $loteId);
        } else {
            // Preparar request para el sistema tradicional
            $request->merge([
                'fechaHora' => now(),
                'lote_id' => $loteId
            ]);
            return $this->pujaController->store($request);
        }
    }

    private function debeUsarRedis($loteId)
    {
        try {
            // 1. Verificar si Redis está disponible
            Redis::ping();
            
            // 2. Verificar si hay alta concurrencia en este lote
            $visualizacionesKey = "lote:$loteId:viendo";
            $usuariosViendo = Redis::scard($visualizacionesKey);
            
            // 3. Usar Redis si hay más de 5 usuarios viendo O si está configurado
            return $usuariosViendo > 5 || config('app.use_redis_pujas', true);
            
        } catch (\Exception $e) {
            // Si Redis no está disponible, usar sistema tradicional
            \Log::warning('Redis no disponible, usando sistema tradicional: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Obtener puja actual usando el sistema correcto
     */
    public function obtenerPujaActual($loteId)
    {
        if ($this->debeUsarRedis($loteId)) {
            return $this->pujaRedisController->obtenerPujaActual($loteId);
        } else {
            // Implementar método tradicional si no existe
            return $this->obtenerPujaActualTradicional($loteId);
        }
    }

    private function obtenerPujaActualTradicional($loteId)
    {
        $ultimaPuja = \App\Models\Puja::where('lote_id', $loteId)
            ->with('cliente.usuario')
            ->orderBy('fechaHora', 'desc')
            ->first();

        if ($ultimaPuja) {
            return response()->json([
                'lote_id' => $loteId,
                'monto' => (float) $ultimaPuja->monto,
                'cliente' => $ultimaPuja->cliente,
                'timestamp' => $ultimaPuja->fechaHora->timestamp,
                'fecha_formateada' => $ultimaPuja->fechaHora->format('Y-m-d H:i:s'),
                'sistema' => 'tradicional'
            ]);
        } else {
            $lote = \App\Models\Lote::find($loteId);
            return response()->json([
                'lote_id' => $loteId,
                'monto' => $lote ? $lote->valorBase : 0,
                'cliente' => null,
                'timestamp' => null,
                'mensaje' => 'No hay pujas para este lote',
                'sistema' => 'tradicional'
            ]);
        }
    }
}
