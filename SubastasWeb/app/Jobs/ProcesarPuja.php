<?php

namespace App\Jobs;

use App\Models\Puja;
use App\Models\Lote;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class ProcesarPuja implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $pujaData;
    protected $loteId;
    
    public $timeout = 30; // Timeout en segundos
    public $tries = 3; // Número de intentos
    public $backoff = [1, 5, 10]; // Backoff progresivo

    /**
     * Create a new job instance.
     */
    public function __construct(array $pujaData, int $loteId)
    {
        $this->pujaData = $pujaData;
        $this->loteId = $loteId;
        
        // Asignar a cola específica del lote para FIFO
        $this->onQueue("lote_{$loteId}_pujas");
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Log::info("🚀 Procesando puja en cola para lote {$this->loteId}", $this->pujaData);
        
        // Usar lock para evitar concurrencia en el mismo lote
        $lockKey = "puja_lock_lote_{$this->loteId}";
        $lock = Redis::set($lockKey, "locked", "EX", 10, "NX");
        
        if (!$lock) {
            Log::warning("⏳ Lote {$this->loteId} bloqueado, reintentando puja");
            $this->release(2); // Reintenta en 2 segundos
            return;
        }

        try {
            // Verificar que el lote aún acepta pujas
            $lote = Lote::find($this->loteId);
            if (!$lote) {
                Log::error("❌ Lote {$this->loteId} no encontrado");
                return;
            }

            // Validar que la subasta esté activa
            if (!$this->esSubastaActiva($lote)) {
                Log::warning("⛔ Subasta del lote {$this->loteId} no está activa");
                return;
            }

            // Verificar que la puja es mayor que la actual
            $ultimaPuja = $this->obtenerUltimaPuja($this->loteId);
            if ($ultimaPuja && $this->pujaData['monto'] <= $ultimaPuja->monto) {
                Log::warning("💰 Puja rechazada: monto {$this->pujaData['monto']} <= última puja {$ultimaPuja->monto}");
                return;
            }

            // Crear la puja
            $puja = Puja::create([
                'fechaHora' => $this->pujaData['fechaHora'],
                'monto' => $this->pujaData['monto'],
                'cliente_id' => $this->pujaData['cliente_id'],
                'lote_id' => $this->loteId,
            ]);

            Log::info("✅ Puja creada con ID: {$puja->id}");

            // Cargar relaciones
            $puja->load(['cliente.usuario', 'lote.subasta']);

            // Publicar evento a Redis para WebSocket
            $this->publicarEventoRedis($puja);

            // Notificar WebSocket directamente (fallback)
            $this->notificarWebSocket($puja);

            // Actualizar estadísticas del lote en Redis
            $this->actualizarEstadisticasLote($puja);

        } catch (\Exception $e) {
            Log::error("❌ Error procesando puja: " . $e->getMessage());
            Log::error("Stack trace: " . $e->getTraceAsString());
            throw $e; // Reintentará automáticamente
        } finally {
            // Liberar el lock
            Redis::del($lockKey);
            Log::info("🔓 Lock liberado para lote {$this->loteId}");
        }
    }

    /**
     * Verificar si la subasta está activa
     */
    private function esSubastaActiva(Lote $lote): bool
    {
        $subasta = $lote->subasta;
        if (!$subasta) return false;

        return $subasta->activa;
    }

    /**
     * Obtener la última puja del lote
     */
    private function obtenerUltimaPuja(int $loteId): ?Puja
    {
        return Puja::where('lote_id', $loteId)
                   ->orderBy('fechaHora', 'desc')
                   ->first();
    }

    /**
     * Publicar evento a Redis para WebSocket
     */
    private function publicarEventoRedis(Puja $puja): void
    {
        try {
            $eventoData = [
                'tipo' => 'nueva_puja',
                'timestamp' => now()->toISOString(),
                'puja' => [
                    'id' => $puja->id,
                    'monto' => $puja->monto,
                    'fechaHora' => $puja->fechaHora,
                    'lote_id' => $puja->lote_id,
                    'cliente_id' => $puja->cliente_id,
                    'cliente' => [
                        'id' => $puja->cliente->id ?? $puja->cliente_id,
                        'usuario' => [
                            'id' => $puja->cliente->usuario->id ?? null,
                            'nombre' => $puja->cliente->usuario->nombre ?? 'Usuario'
                        ]
                    ],
                    'lote' => [
                        'id' => $puja->lote->id,
                        'valorBase' => $puja->lote->valorBase,
                        'pujaMinima' => $puja->lote->pujaMinima,
                        'subasta' => [
                            'id' => $puja->lote->subasta->id ?? null,
                            'fechaInicio' => $puja->lote->subasta->fechaInicio ?? null,
                            'fechaFin' => $puja->lote->subasta->fechaFin ?? null
                        ]
                    ]
                ]
            ];

            // Publicar al canal general de pujas
            Redis::publish('pujas_channel', json_encode($eventoData));
            
            // Publicar a canal específico del lote
            Redis::publish("lote_{$puja->lote_id}_pujas", json_encode($eventoData));
            
            Log::info("📡 Evento publicado a Redis - Canales: pujas_channel, lote_{$puja->lote_id}_pujas");
            
        } catch (\Exception $e) {
            Log::error("❌ Error publicando a Redis: " . $e->getMessage());
        }
    }

    /**
     * Notificar WebSocket directamente (fallback)
     */
    private function notificarWebSocket(Puja $puja): void
    {
        try {
            $response = Http::timeout(5)->post('http://websocket:3001/notify', [
                'event' => 'nueva_puja',
                'data' => [
                    'puja_id' => $puja->id,
                    'monto' => $puja->monto,
                    'lote_id' => $puja->lote_id,
                    'cliente_id' => $puja->cliente_id,
                    'fechaHora' => $puja->fechaHora
                ]
            ]);

            if ($response->successful()) {
                Log::info("🔔 WebSocket notificado exitosamente");
            }
        } catch (\Exception $e) {
            Log::warning("⚠️ Error notificando WebSocket: " . $e->getMessage());
        }
    }

    /**
     * Actualizar estadísticas del lote en Redis
     */
    private function actualizarEstadisticasLote(Puja $puja): void
    {
        try {
            $key = "lote_stats_{$puja->lote_id}";
            $stats = [
                'ultima_puja' => $puja->monto,
                'total_pujas' => Redis::zcard("pujas_lote_{$puja->lote_id}") + 1,
                'ultimo_update' => now()->toISOString()
            ];
            
            Redis::hMSet($key, $stats);
            Redis::expire($key, 86400); // Expira en 24 horas
            
            // Agregar a sorted set para ranking
            Redis::zadd("pujas_lote_{$puja->lote_id}", time(), json_encode([
                'puja_id' => $puja->id,
                'monto' => $puja->monto,
                'cliente_id' => $puja->cliente_id,
                'timestamp' => $puja->fechaHora
            ]));
            
            // Mantener solo las últimas 100 pujas
            Redis::zremrangebyrank("pujas_lote_{$puja->lote_id}", 0, -101);
            
            Log::info("📊 Estadísticas actualizadas para lote {$puja->lote_id}");
            
        } catch (\Exception $e) {
            Log::error("❌ Error actualizando estadísticas: " . $e->getMessage());
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error("❌ Job ProcesarPuja falló definitivamente para lote {$this->loteId}");
        Log::error("Error: " . $exception->getMessage());
        Log::error("Datos de puja: " . json_encode($this->pujaData));
    }
}
