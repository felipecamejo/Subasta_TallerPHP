<?php

require_once 'vendor/autoload.php';

// Cargar configuración de Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Notificacion;
use App\Models\CasaRemate;
use App\Models\Cliente;
use Illuminate\Support\Facades\DB;

echo "🔍 Debug: Notificaciones Casa de Remate\n\n";

try {
    // 1. Obtener casa de remate
    $casaRemate = CasaRemate::with('usuario')->first();
    if (!$casaRemate) {
        echo "❌ No se encontró casa de remate\n";
        exit(1);
    }
    
    echo "✅ Casa de Remate encontrada:\n";
    echo "   - usuario_id: {$casaRemate->usuario_id}\n";
    echo "   - Nombre: {$casaRemate->usuario->nombre}\n";
    echo "   - Email: {$casaRemate->usuario->email}\n\n";
    
    // 2. Verificar notificaciones en la tabla pivot
    $notificacionesPivot = DB::table('notificaciones_casaremates')
        ->where('casa_remate_id', $casaRemate->usuario_id)
        ->get();
    
    echo "📋 Notificaciones en tabla pivot (notificaciones_casaremates):\n";
    echo "   Total: " . $notificacionesPivot->count() . "\n";
    
    if ($notificacionesPivot->count() > 0) {
        foreach ($notificacionesPivot as $pivot) {
            echo "   - notificacion_id: {$pivot->notificacion_id}, leido: " . ($pivot->leido ? 'true' : 'false') . "\n";
        }
    }
    echo "\n";
    
    // 3. Verificar notificaciones usando la relación
    $notificacionesRelacion = $casaRemate->notificaciones()->get();
    
    echo "📋 Notificaciones usando relación (casaRemate->notificaciones()):\n";
    echo "   Total: " . $notificacionesRelacion->count() . "\n";
    
    if ($notificacionesRelacion->count() > 0) {
        foreach ($notificacionesRelacion as $notif) {
            echo "   - ID: {$notif->id}\n";
            echo "   - Título: {$notif->titulo}\n";
            echo "   - Mensaje: {$notif->mensaje}\n";
            echo "   - Es chat: " . ($notif->es_mensaje_chat ? 'true' : 'false') . "\n";
            echo "   - Leído: " . ($notif->pivot->leido ? 'true' : 'false') . "\n";
            echo "   ---\n";
        }
    }
    echo "\n";
    
    // 4. Probar el endpoint público
    echo "🌐 Probando endpoint público:\n";
    
    $controller = new App\Http\Controllers\NotificacionController();
    $response = $controller->obtenerNotificacionesPublico($casaRemate->usuario_id);
    $responseData = json_decode($response->getContent(), true);
    
    echo "   Total notificaciones en endpoint: " . count($responseData) . "\n";
    
    if (count($responseData) > 0) {
        foreach ($responseData as $notif) {
            echo "   - ID: {$notif['id']}\n";
            echo "   - Título: {$notif['titulo']}\n";
            echo "   - Es chat: " . ($notif['esMensajeChat'] ? 'true' : 'false') . "\n";
            echo "   - Leído: " . ($notif['leido'] ? 'true' : 'false') . "\n";
            echo "   ---\n";
        }
    }
    
    // 5. Verificar también para un cliente (comparación)
    echo "\n🔄 Comparación con Cliente:\n";
    $cliente = Cliente::with('usuario')->first();
    if ($cliente) {
        $notificacionesCliente = $cliente->notificaciones()->get();
        echo "   Cliente '{$cliente->usuario->nombre}' tiene: " . $notificacionesCliente->count() . " notificaciones\n";
        
        $responseCliente = $controller->obtenerNotificacionesPublico($cliente->usuario_id);
        $responseClienteData = json_decode($responseCliente->getContent(), true);
        echo "   Endpoint cliente retorna: " . count($responseClienteData) . " notificaciones\n";
    }

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Archivo: " . $e->getFile() . "\n";
    echo "Línea: " . $e->getLine() . "\n";
}
