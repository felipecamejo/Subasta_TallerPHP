<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use DateTimeZone;
use DateTime;
use Carbon\Carbon;

class TimezoneController extends Controller
{
    /**
     * Obtener la lista de zonas horarias disponibles
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getTimezones()
    {
        // Obtenemos todas las zonas horarias disponibles
        $timezones = DateTimeZone::listIdentifiers();
        
        return response()->json($timezones);
    }

    /**
     * Convertir una fecha entre zonas horarias
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function convertTime(Request $request)
    {
        $request->validate([
            'datetime' => 'required|string',
            'from_timezone' => 'required|string',
            'to_timezone' => 'required|string',
            'format' => 'nullable|string',
        ]);

        try {
            // Parsear la fecha y hora original
            $datetime = new DateTime($request->datetime, new DateTimeZone($request->from_timezone));
            
            // Convertir a la zona horaria destino
            $datetime->setTimezone(new DateTimeZone($request->to_timezone));
            
            // Formato de salida (por defecto ISO)
            $format = $request->format ?? 'c';
            
            return response()->json([
                'original' => $request->datetime,
                'converted' => $datetime->format($format),
                'timezone' => $request->to_timezone,
                'offset' => $datetime->getOffset() / 3600 // Convertir segundos a horas
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al convertir la zona horaria',
                'message' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Obtener la información actual de una zona horaria
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getTimezoneInfo(Request $request)
    {
        $request->validate([
            'timezone' => 'required|string',
        ]);

        try {
            $timezone = new DateTimeZone($request->timezone);
            $now = new DateTime('now', $timezone);
            
            // Obtener información detallada
            $transitions = $timezone->getTransitions(time(), time() + 31536000); // Un año adelante
            
            return response()->json([
                'timezone' => $request->timezone,
                'current_time' => $now->format('Y-m-d H:i:s'),
                'offset' => $timezone->getOffset($now) / 3600, // En horas
                'dst' => $transitions[0]['isdst'] ?? false,
                'abbreviation' => $transitions[0]['abbr'] ?? '',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Zona horaria inválida',
                'message' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Formatea las fechas para las subastas según la zona horaria del usuario
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function formatSubastaTime(Request $request)
    {
        $request->validate([
            'subasta_id' => 'required|integer|exists:lotes,id',
            'timezone' => 'nullable|string',
        ]);

        // Obtener la zona horaria del usuario o usar UTC por defecto
        $userTimezone = $request->timezone ?? 'UTC';

        try {
            // Obtener la información del lote (subasta)
            $lote = \App\Models\Lote::findOrFail($request->subasta_id);
            
            // Convertir las fechas
            $fechaInicio = Carbon::parse($lote->fecha_inicio)
                ->setTimezone($userTimezone);
                
            $fechaFin = Carbon::parse($lote->fecha_fin)
                ->setTimezone($userTimezone);
            
            return response()->json([
                'subasta_id' => $lote->id,
                'nombre' => $lote->nombre,
                'fecha_inicio' => [
                    'utc' => $lote->fecha_inicio,
                    'user_timezone' => $fechaInicio->format('Y-m-d H:i:s'),
                    'formatted' => $fechaInicio->format('d/m/Y H:i'),
                    'human' => $fechaInicio->diffForHumans()
                ],
                'fecha_fin' => [
                    'utc' => $lote->fecha_fin,
                    'user_timezone' => $fechaFin->format('Y-m-d H:i:s'),
                    'formatted' => $fechaFin->format('d/m/Y H:i'),
                    'human' => $fechaFin->diffForHumans()
                ],
                'timezone' => $userTimezone,
                'timezone_info' => [
                    'offset' => (new DateTimeZone($userTimezone))->getOffset(new DateTime()) / 3600
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al formatear las fechas',
                'message' => $e->getMessage()
            ], 400);
        }
    }
}
