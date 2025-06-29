<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class PujaWebSocketService
{
    private static $redis;

    private static function getRedis()
    {
        if (!self::$redis) {
            self::$redis = new SimpleRedisClient();
        }
        return self::$redis;
    }
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
            $redis = self::getRedis();
            $redis->publish("lote:$loteId", json_encode($mensaje));
            $redis->publish("subastas:general", json_encode($mensaje));
            
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

            $redis = self::getRedis();
            $redis->publish("lote:$loteId:stats", json_encode($mensaje));
            
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

            $redis = self::getRedis();
            $redis->publish("lote:$loteId", json_encode($mensaje));
            $redis->publish("subastas:general", json_encode($mensaje));
            
        } catch (\Exception $e) {
            Log::error("Error notificando fin de subasta: " . $e->getMessage());
        }
    }
}
