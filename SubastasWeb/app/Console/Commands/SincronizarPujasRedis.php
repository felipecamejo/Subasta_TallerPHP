<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Redis;
use App\Models\Puja;
use App\Models\Lote;
use App\Models\Cliente;
use Carbon\Carbon;

class SincronizarPujasRedis extends Command
{
    protected $signature = 'redis:sincronizar-pujas {--lote=}';
    protected $description = 'Sincronizar pujas de Redis con PostgreSQL';

    public function handle()
    {
        $loteId = $this->option('lote');
        
        if ($loteId) {
            $this->sincronizarLote($loteId);
        } else {
            $this->sincronizarTodosLosLotes();
        }
    }

    private function sincronizarLote($loteId)
    {
        $this->info("Sincronizando lote $loteId...");
        
        $historialKey = "lote:$loteId:historial";
        $historial = Redis::zrange($historialKey, 0, -1, 'WITHSCORES');
        
        $contador = 0;
        for ($i = 0; $i < count($historial); $i += 2) {
            $data = explode(':', $historial[$i]);
            $timestamp = $historial[$i + 1];
            
            if (count($data) >= 3) {
                $clienteId = $data[0];
                $monto = $data[1];
                $fecha = Carbon::createFromTimestamp($timestamp);
                
                // Verificar si ya existe
                $existePuja = Puja::where([
                    'lote_id' => $loteId,
                    'cliente_id' => $clienteId,
                    'monto' => $monto,
                ])->whereBetween('fechaHora', [
                    $fecha->copy()->subSeconds(5),
                    $fecha->copy()->addSeconds(5)
                ])->exists();
                
                if (!$existePuja) {
                    Puja::create([
                        'monto' => $monto,
                        'fechaHora' => $fecha, // Usar fechaHora según el modelo
                        'cliente_id' => $clienteId,
                        'lote_id' => $loteId
                    ]);
                    $contador++;
                }
            }
        }
        
        $this->info("$contador pujas sincronizadas para el lote $loteId");
    }

    private function sincronizarTodosLosLotes()
    {
        $this->info("Buscando lotes con pujas en Redis...");
        
        $keys = Redis::keys("lote:*:historial");
        
        foreach ($keys as $key) {
            if (preg_match('/lote:(\d+):historial/', $key, $matches)) {
                $loteId = $matches[1];
                $this->sincronizarLote($loteId);
            }
        }
        
        $this->info("Sincronización completa terminada.");
    }
}
