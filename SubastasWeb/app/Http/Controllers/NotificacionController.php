<?php

namespace App\Http\Controllers;

use App\Models\Notificacion;
use App\Models\Cliente;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Mappers\Mapper;
use OpenApi\Annotations as OA;

/**
 * @OA\Tag(
 *     name="Notificaciones",
 *     description="API para gestionar notificaciones"
 * )
 */
class NotificacionController extends Controller
{
    protected array $visited = [];
    protected int $maxDepth = 3;

    /**
     * @OA\Get(
     *     path="/api/notificaciones",
     *     summary="Obtener notificaciones del usuario autenticado",
     *     tags={"Notificaciones"},
     *     @OA\Response(
     *         response=200,
     *         description="Lista de notificaciones",
     *         @OA\JsonContent(type="array", @OA\Items(type="object"))
     *     ),
     *     @OA\Response(response=401, description="No autorizado"),
     *     @OA\Response(response=500, description="Error del servidor")
     * )
     */
    public function index(Request $request)
    {
        try {
            $usuario = Auth::user();
            $cliente = Cliente::where('usuario_id', $usuario->id)->first();
            
            if (!$cliente) {
                return response()->json(['error' => 'Cliente no encontrado'], 404);
            }

            $notificaciones = $cliente->notificaciones()
                ->orderBy('fecha_hora', 'desc')
                ->get()
                ->map(function ($notificacion) use ($cliente) {
                    $leido = $notificacion->pivot->leido;                    return [
                        'id' => $notificacion->id,
                        'titulo' => $notificacion->titulo,
                        'mensaje' => $notificacion->mensaje,
                        'fechaHora' => $notificacion->fecha_hora,
                        'leido' => $leido,
                        'esMensajeChat' => $notificacion->es_mensaje_chat,
                        'usuario' => [
                            'id' => $cliente->usuario_id,
                            'nombre' => $cliente->usuario->nombre
                        ]
                    ];
                });

            return response()->json($notificaciones);

        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'Error al obtener notificaciones',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Put(
     *     path="/api/notificaciones/{id}/leer",
     *     summary="Marcar una notificación como leída",
     *     tags={"Notificaciones"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Notificación marcada como leída"),
     *     @OA\Response(response=401, description="No autorizado"),
     *     @OA\Response(response=404, description="Notificación no encontrada")
     * )
     */
    public function marcarLeida($id)
    {
        try {
            $usuario = Auth::user();
            $cliente = Cliente::where('usuario_id', $usuario->id)->first();
            
            if (!$cliente) {
                return response()->json(['error' => 'Cliente no encontrado'], 404);
            }

            $notificacion = $cliente->notificaciones()->find($id);
            
            if (!$notificacion) {
                return response()->json(['error' => 'Notificación no encontrada'], 404);
            }

            $cliente->notificaciones()->updateExistingPivot($id, ['leido' => true]);

            return response()->json(['mensaje' => 'Notificación marcada como leída']);

        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'Error al marcar notificación como leída',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Put(
     *     path="/api/notificaciones/leer-todas",
     *     summary="Marcar todas las notificaciones como leídas",
     *     tags={"Notificaciones"},
     *     @OA\Response(response=200, description="Todas las notificaciones marcadas como leídas"),
     *     @OA\Response(response=401, description="No autorizado"),
     *     @OA\Response(response=500, description="Error del servidor")
     * )
     */
    public function marcarTodasLeidas()
    {
        try {
            $usuario = Auth::user();
            $cliente = Cliente::where('usuario_id', $usuario->id)->first();
            
            if (!$cliente) {
                return response()->json(['error' => 'Cliente no encontrado'], 404);
            }

            $cliente->notificaciones()->updateExistingPivot(
                $cliente->notificaciones()->pluck('notificaciones.id'),
                ['leido' => true]
            );

            return response()->json(['mensaje' => 'Todas las notificaciones marcadas como leídas']);

        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'Error al marcar notificaciones como leídas',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crea una nueva notificación para uno o varios clientes
     * 
     * @param array $clienteIds Array de IDs de clientes
     * @param string $titulo Título de la notificación
     * @param string $mensaje Contenido de la notificación
     * @param bool $esMensajeChat Si la notificación corresponde a un mensaje de chat
     * @return Notificacion
     */
    public static function createNotificacion(array $clienteIds, string $titulo, string $mensaje, bool $esMensajeChat = false): Notificacion 
    {
        try {
            $notificacion = Notificacion::create([
                'titulo' => $titulo,
                'mensaje' => $mensaje,
                'es_mensaje_chat' => $esMensajeChat,
                'fecha_hora' => now()
            ]);

            // Asociar la notificación con los clientes especificados
            foreach ($clienteIds as $clienteId) {
                $notificacion->clientes()->attach($clienteId, ['leido' => false]);
            }

            return $notificacion;

        } catch (\Throwable $e) {
            \Log::error('Error al crear notificación: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Obtener notificaciones sin autenticación (versión pública)
     */
    public function notificacionesPublicas()
    {
        try {
            // Por ahora, devolvemos notificaciones de ejemplo
            $notificaciones = [
                [
                    'id' => 1,
                    'titulo' => 'Bienvenido al sistema',
                    'mensaje' => '¡Gracias por unirte a nuestro sistema de subastas!',
                    'fechaHora' => now(),
                    'leido' => false,
                    'usuario' => [
                        'id' => 1,
                        'nombre' => 'Usuario'
                    ]
                ],
                [
                    'id' => 2,
                    'titulo' => 'Nueva subasta disponible',
                    'mensaje' => 'Se ha publicado una nueva subasta que podría interesarte',
                    'fechaHora' => now()->subHour(),
                    'leido' => true,
                    'usuario' => [
                        'id' => 1,
                        'nombre' => 'Usuario'
                    ]
                ]
            ];

            return response()->json($notificaciones);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al obtener notificaciones'], 500);
        }
    }

    /**
     * Marcar una notificación como leída sin autenticación
     */
    public function marcarLeidaSinAutenticacion($id)
    {
        try {
            // Por ahora solo devolvemos una respuesta exitosa
            return response()->json(['message' => 'Notificación marcada como leída']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al marcar notificación'], 500);
        }
    }

    /**
     * Marcar todas las notificaciones como leídas sin autenticación
     */
    public function marcarTodasLeidasSinAutenticacion()
    {
        try {
            // Por ahora solo devolvemos una respuesta exitosa
            return response()->json(['message' => 'Todas las notificaciones marcadas como leídas']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al marcar notificaciones'], 500);
        }
    }
}
