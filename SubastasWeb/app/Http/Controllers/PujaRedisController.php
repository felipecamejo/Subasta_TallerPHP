<?php

namespace App\Http\Controllers;

use App\Models\Puja;
use App\Models\Lote;
use App\Models\Cliente;
use App\Services\PujaWebSocketService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

/**
 * @OA\Tag(
 *     name="Pujas Redis",
 *     description="API para gestionar pujas usando Redis para alta concurrencia"
 * )
 */
class PujaRedisController extends Controller
{
    /**
     * @OA\Post(
     *     path="/api/pujas-redis/{loteId}/pujar",
     *     summary="Realizar una puja usando Redis para prevenir conflictos",
     *     tags={"Pujas Redis"},
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
     *     @OA\Response(response=200, description="Puja realizada exitosamente"),
     *     @OA\Response(response=422, description="Puja rechazada"),
     *     @OA\Response(response=404, description="Lote no encontrado")
     * )
     */
    public function realizarPuja(Request $request, $loteId)
    {
        try {
            // Debug: Log de entrada
            Log::info('=== INICIO PUJA REDIS DEBUG ===', [
                'loteId' => $loteId,
                'request_data' => $request->all(),
                'headers' => $request->headers->all()
            ]);

            // Debug: Verificar si el usuario existe antes de la validación
            $clienteIdRequest = $request->cliente_id;
            $usuarioExiste = \App\Models\Usuario::where('id', $clienteIdRequest)->exists();
            Log::info('Pre-validación:', [
                'cliente_id_request' => $clienteIdRequest,
                'usuario_existe' => $usuarioExiste ? 'SI' : 'NO'
            ]);

            $request->validate([
                'cliente_id' => 'required|exists:usuarios,id',
                'monto' => 'required|numeric|min:0'
            ]);

            $lote = Lote::find($loteId);
            if (!$lote) {
                Log::error('Lote no encontrado', ['loteId' => $loteId]);
                return response()->json(['error' => 'Lote no encontrado'], 404);
            }

            $clienteId = $request->cliente_id;
            $montoPuja = $request->monto;
            
            // Debug: Verificar existencia del cliente
            $cliente = Cliente::where('usuario_id', $clienteId)->first();
            Log::info('Cliente encontrado:', [
                'cliente_id' => $clienteId,
                'cliente_existe' => $cliente ? 'SÍ' : 'NO',
                'cliente_data' => $cliente ? $cliente->toArray() : null
            ]);

            // Usar transacción atómica de Redis
            $resultado = $this->procesarPujaAtomica($loteId, $clienteId, $montoPuja, $lote);

            if ($resultado['exito']) {
                // Sincronizar con base de datos PostgreSQL en background
                $this->sincronizarConBaseDatos($loteId, $clienteId, $montoPuja);
                
                // Notificar a todos los usuarios conectados vía WebSocket
                PujaWebSocketService::notificarNuevaPuja($loteId, $resultado['puja']);
                
                return response()->json([
                    'message' => 'Puja realizada exitosamente',
                    'puja' => $resultado['puja'],
                    'puja_anterior' => $resultado['puja_anterior']
                ]);
            } else {
                return response()->json([
                    'error' => $resultado['mensaje'],
                    'puja_actual' => $resultado['puja_actual']
                ], 422);
            }

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Error de validación en puja Redis:', [
                'errors' => $e->errors(),
                'request_data' => $request->all(),
                'cliente_id_enviado' => $request->cliente_id,
                'usuario_existe_check' => \App\Models\Usuario::where('id', $request->cliente_id)->exists()
            ]);
            
            $errorMessage = 'Los datos enviados no son válidos';
            $errors = $e->errors();
            
            // Mensaje específico para cliente_id
            if (isset($errors['cliente_id'])) {
                $errorMessage = 'El usuario especificado no existe en el sistema.';
            }
            
            return response()->json([
                'error' => $errorMessage,
                'errors' => $errors,
                'message' => 'Error de validación',
                'debug_info' => [
                    'cliente_id_enviado' => $request->cliente_id,
                    'exists_check' => \App\Models\Usuario::where('id', $request->cliente_id)->exists(),
                    'total_usuarios' => \App\Models\Usuario::count()
                ]
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error en puja Redis: ' . $e->getMessage(), [
                'exception' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);
            return response()->json(['error' => 'Error interno del servidor'], 500);
        }
    }

    /**
     * Procesar puja de forma atómica usando Redis
     */
    private function procesarPujaAtomica($loteId, $clienteId, $montoPuja, $lote)
    {
        // Script Lua para operación atómica
        $luaScript = '
            local lote_key = KEYS[1]
            local historial_key = KEYS[2]
            local cliente_id = ARGV[1]
            local monto_puja = tonumber(ARGV[2])
            local valor_base = tonumber(ARGV[3])
            local puja_minima = tonumber(ARGV[4])
            
            -- Obtener puja actual
            local puja_actual = redis.call("HGET", lote_key, "monto")
            if not puja_actual then
                puja_actual = valor_base
            else
                puja_actual = tonumber(puja_actual)
            end
            
            -- Validar que la nueva puja sea mayor
            local monto_minimo = math.max(puja_actual + puja_minima, valor_base)
            if monto_puja < monto_minimo then
                return {0, puja_actual, "Puja debe ser mayor a " .. monto_minimo}
            end
            
            -- Guardar puja anterior para retornar
            local puja_anterior = {
                cliente_id = redis.call("HGET", lote_key, "cliente_id") or "",
                monto = puja_actual,
                timestamp = redis.call("HGET", lote_key, "timestamp") or ""
            }
            
            -- Actualizar puja actual
            local timestamp = ARGV[5]
            redis.call("HMSET", lote_key, 
                "monto", monto_puja,
                "cliente_id", cliente_id,
                "timestamp", timestamp
            )
            
            -- Agregar al historial
            redis.call("ZADD", historial_key, timestamp, cliente_id .. ":" .. monto_puja .. ":" .. timestamp)
            
            -- Retornar éxito y datos
            return {1, monto_puja, cliente_id, timestamp, puja_anterior[1], puja_anterior[2], puja_anterior[3]}
        ';

        $loteKey = "lote:$loteId:puja";
        $historialKey = "lote:$loteId:historial";
        $timestamp = Carbon::now()->timestamp;

        $resultado = Redis::eval(
            $luaScript,
            2, // número de KEYS
            $loteKey,
            $historialKey,
            $clienteId,
            $montoPuja,
            $lote->valorBase ?? 0,
            $lote->pujaMinima ?? 1,
            $timestamp
        );

        if ($resultado[0] == 1) {
            return [
                'exito' => true,
                'puja' => [
                    'lote_id' => $loteId,
                    'cliente_id' => $resultado[2],
                    'monto' => $resultado[1],
                    'timestamp' => $resultado[3]
                ],
                'puja_anterior' => [
                    'cliente_id' => $resultado[4] ?? null,
                    'monto' => $resultado[5] ?? null,
                    'timestamp' => $resultado[6] ?? null
                ]
            ];
        } else {
            return [
                'exito' => false,
                'mensaje' => $resultado[2],
                'puja_actual' => $resultado[1]
            ];
        }
    }

    /**
     * Sincronizar puja con PostgreSQL en background
     */
    private function sincronizarConBaseDatos($loteId, $clienteId, $monto)
    {
        try {
            // Verificar si existe un registro en la tabla clientes para este usuario
            $cliente = Cliente::where('usuario_id', $clienteId)->first();
            $lote = Lote::find($loteId);

            // Solo crear la puja si existe tanto el cliente como el lote
            if ($cliente && $lote) {
                Puja::create([
                    'monto' => $monto,
                    'fechaHora' => Carbon::now(),
                    'cliente_id' => $clienteId, // Este es el usuario_id
                    'lote_id' => $loteId
                ]);
                Log::info('Puja sincronizada con BD', ['lote_id' => $loteId, 'cliente_id' => $clienteId, 'monto' => $monto]);
            } else {
                Log::warning('No se pudo sincronizar puja - cliente o lote no encontrado', [
                    'cliente_existe' => $cliente ? 'SI' : 'NO',
                    'lote_existe' => $lote ? 'SI' : 'NO',
                    'cliente_id' => $clienteId,
                    'lote_id' => $loteId
                ]);
            }
        } catch (\Exception $e) {
            Log::error("Error sincronizando puja con BD: " . $e->getMessage());
        }
    }

    /**
     * @OA\Get(
     *     path="/api/pujas-redis/{loteId}/actual",
     *     summary="Obtener puja actual de un lote desde Redis",
     *     tags={"Pujas Redis"},
     *     @OA\Parameter(
     *         name="loteId",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Puja actual obtenida")
     * )
     */
    public function obtenerPujaActual($loteId)
    {
        try {
            $loteKey = "lote:$loteId:puja";
            
            $pujaData = Redis::hmget($loteKey, ['monto', 'cliente_id', 'timestamp']);
            
            if ($pujaData[0]) {
                $cliente = Cliente::with('usuario')->find($pujaData[1]);
                
                return response()->json([
                    'lote_id' => $loteId,
                    'monto' => (float) $pujaData[0],
                    'cliente' => $cliente,
                    'timestamp' => $pujaData[2],
                    'fecha_formateada' => Carbon::createFromTimestamp($pujaData[2])->format('Y-m-d H:i:s')
                ]);
            } else {
                // No hay pujas, devolver datos del lote
                $lote = Lote::find($loteId);
                return response()->json([
                    'lote_id' => $loteId,
                    'monto' => $lote ? $lote->valorBase : 0,
                    'cliente' => null,
                    'timestamp' => null,
                    'mensaje' => 'No hay pujas para este lote'
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Error obteniendo puja actual: ' . $e->getMessage());
            return response()->json(['error' => 'Error interno del servidor'], 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/api/pujas-redis/{loteId}/historial",
     *     summary="Obtener historial de pujas de un lote desde Redis",
     *     tags={"Pujas Redis"},
     *     @OA\Parameter(
     *         name="loteId",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Historial de pujas obtenido")
     * )
     */
    public function obtenerHistorialPujas($loteId)
    {
        try {
            $historialKey = "lote:$loteId:historial";
            
            // Obtener últimas 50 pujas ordenadas por timestamp (desc)
            $historial = Redis::zrevrange($historialKey, 0, 49, 'WITHSCORES');
            
            $pujas = [];
            for ($i = 0; $i < count($historial); $i += 2) {
                $data = explode(':', $historial[$i]);
                $timestamp = $historial[$i + 1];
                
                if (count($data) >= 3) {
                    $cliente = Cliente::with('usuario')->find($data[0]);
                    
                    $pujas[] = [
                        'cliente' => $cliente,
                        'monto' => (float) $data[1],
                        'timestamp' => $timestamp,
                        'fecha_formateada' => Carbon::createFromTimestamp($timestamp)->format('Y-m-d H:i:s')
                    ];
                }
            }
            
            return response()->json([
                'lote_id' => $loteId,
                'total_pujas' => count($pujas),
                'pujas' => $pujas
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error obteniendo historial: ' . $e->getMessage());
            return response()->json(['error' => 'Error interno del servidor'], 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/api/pujas-redis/{loteId}/estadisticas",
     *     summary="Obtener estadísticas en tiempo real de un lote",
     *     tags={"Pujas Redis"},
     *     @OA\Parameter(
     *         name="loteId",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Estadísticas obtenidas")
     * )
     */
    public function obtenerEstadisticas($loteId)
    {
        try {
            $loteKey = "lote:$loteId:puja";
            $historialKey = "lote:$loteId:historial";
            $visualizacionesKey = "lote:$loteId:viendo";
            
            // Obtener datos actuales
            $pujaActual = Redis::hmget($loteKey, ['monto', 'cliente_id']);
            $totalPujas = Redis::zcard($historialKey);
            $usuariosViendo = Redis::scard($visualizacionesKey);
            
            return response()->json([
                'lote_id' => $loteId,
                'puja_actual' => $pujaActual[0] ? (float) $pujaActual[0] : 0,
                'total_pujas' => $totalPujas,
                'usuarios_viendo' => $usuariosViendo,
                'timestamp' => Carbon::now()->timestamp
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error obteniendo estadísticas: ' . $e->getMessage());
            return response()->json(['error' => 'Error interno del servidor'], 500);
        }
    }

    /**
     * Marcar usuario como viendo un lote (para estadísticas)
     */
    public function marcarVisualizacion(Request $request, $loteId)
    {
        try {
            $usuarioId = $request->usuario_id;
            $visualizacionesKey = "lote:$loteId:viendo";
            
            // Agregar usuario al set con expiración de 30 segundos
            Redis::sadd($visualizacionesKey, $usuarioId);
            Redis::expire($visualizacionesKey, 30);
            
            return response()->json(['message' => 'Visualización registrada']);
            
        } catch (\Exception $e) {
            Log::error('Error registrando visualización: ' . $e->getMessage());
            return response()->json(['error' => 'Error interno del servidor'], 500);
        }
    }

    /**
     * 🔧 DEBUG: Verificar si el usuario existe en la tabla clientes
     */
    public function debugCliente($usuarioId)
    {
        try {
            $usuario = \App\Models\Usuario::find($usuarioId);
            $cliente = Cliente::where('usuario_id', $usuarioId)->first();
            
            return response()->json([
                'usuario_id' => $usuarioId,
                'usuario_existe' => $usuario ? true : false,
                'usuario_data' => $usuario ? [
                    'id' => $usuario->id,
                    'nombre' => $usuario->nombre,
                    'email' => $usuario->email,
                    'rol' => $usuario->rol ?? 'sin_rol'
                ] : null,
                'cliente_existe' => $cliente ? true : false,
                'cliente_data' => $cliente ? $cliente->toArray() : null,
                'debug_info' => [
                    'total_usuarios' => \App\Models\Usuario::count(),
                    'total_clientes' => Cliente::count(),
                    'usuarios_sin_cliente' => \App\Models\Usuario::whereNotIn('id', Cliente::pluck('usuario_id')->toArray())->count()
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error en debug cliente: ' . $e->getMessage());
            return response()->json(['error' => 'Error interno del servidor'], 500);
        }
    }

    /**
     * 🔧 DEBUG TEMPORAL: Verificar usuario directamente
     */
    public function debugUsuarioDirecto($usuarioId)
    {
        try {
            $usuario = \App\Models\Usuario::find($usuarioId);
            $usuarioExists = \App\Models\Usuario::where('id', $usuarioId)->exists();
            $allUsuarios = \App\Models\Usuario::select('id', 'nombre', 'email')->get();
            
            return response()->json([
                'usuario_id' => $usuarioId,
                'usuario_find' => $usuario ? $usuario->toArray() : null,
                'usuario_exists' => $usuarioExists,
                'total_usuarios' => \App\Models\Usuario::count(),
                'primeros_10_usuarios' => $allUsuarios->take(10)->toArray(),
                'database_connection' => \DB::connection()->getDatabaseName(),
                'table_exists' => \Schema::hasTable('usuarios')
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }
}
