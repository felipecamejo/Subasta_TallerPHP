<?php

namespace App\Services;

use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Log;

class PujaWebSocketService
{
    /**
     * Notificar nueva puja a todos los usuarios conectados
     */
    public static function notificarNuevaPuja($loteId, $pujaData)
    {
        try {
            $mensaje = [
                'tipo' => 'nueva_puja',
                'lote_id' => $loteId,
                'puja' => $pujaData,
                'timestamp' => time()
            ];

            // Publicar en canal Redis para WebSocket
            Redis::publish("lote:$loteId", json_encode($mensaje));
            Redis::publish("subastas:general", json_encode($mensaje));
            
            Log::info("Puja notificada vía WebSocket", $mensaje);
            
        } catch (\Exception $e) {
            Log::error("Error notificando puja: " . $e->getMessage());
        }
    }

    /**
     * Notificar estadísticas actualizadas
     */
    public static function notificarEstadisticas($loteId, $estadisticas)
    {
        try {
            $mensaje = [
                'tipo' => 'estadisticas',
                'lote_id' => $loteId,
                'data' => $estadisticas,
                'timestamp' => time()
            ];

            Redis::publish("lote:$loteId:stats", json_encode($mensaje));
            
        } catch (\Exception $e) {
            Log::error("Error notificando estadísticas: " . $e->getMessage());
        }
    }

    /**
     * Notificar fin de subasta
     */
    public static function notificarFinSubasta($loteId, $ganador = null)
    {
        try {
            $mensaje = [
                'tipo' => 'fin_subasta',
                'lote_id' => $loteId,
                'ganador' => $ganador,
                'timestamp' => time()
            ];

            Redis::publish("lote:$loteId", json_encode($mensaje));
            Redis::publish("subastas:general", json_encode($mensaje));
            
        } catch (\Exception $e) {
            Log::error("Error notificando fin de subasta: " . $e->getMessage());
        }
    }
}
