<?php

namespace App\Http\Controllers;

use App\Models\Notificacion;
use App\Models\Cliente;
use App\Models\Rematador;
use App\Models\Usuario;
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
        $rematador = Rematador::where('usuario_id', $usuario->id)->first();
        $casa = \App\Models\CasaRemate::where('usuario_id', $usuario->id)->first();
        $admin = \App\Models\Admin::where('usuario_id', $usuario->id)->first();

        // Si no tiene ningún tipo válido
        if (!$cliente && !$rematador && !$casa && !$admin) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }

        // Solo cliente y rematador reciben notificaciones
        if ($cliente) {
            $notificaciones = $cliente->notificaciones()
                ->orderBy('fecha_hora', 'desc')
                ->get()
                ->map(fn($n) => $this->formatNotification($n, $cliente->usuario));
        } elseif ($rematador) {
            $notificaciones = $rematador->notificaciones()
                ->orderBy('fecha_hora', 'desc')
                ->get()
                ->map(fn($n) => $this->formatNotification($n, $rematador->usuario));
        } else {
            // Admins o casas de remate no reciben notificaciones por ahora
            return response()->json([]);
        }

        return response()->json($notificaciones);
    } catch (\Throwable $e) {
        return response()->json([
            'error' => 'Error al obtener notificaciones',
            'message' => $e->getMessage()
        ], 500);
    }
}

    /**
     * Formatea una notificación para la respuesta de la API
     */
    private function formatNotification($notificacion, $usuario) 
    {
        return [
            'id' => $notificacion->id,
            'titulo' => $notificacion->titulo,
            'mensaje' => $notificacion->mensaje,
            'fechaHora' => $notificacion->fecha_hora,
            'leido' => $notificacion->pivot->leido,
            'esMensajeChat' => $notificacion->es_mensaje_chat,
            'usuario' => [
                'id' => $usuario->id,
                'nombre' => $usuario->nombre
            ]
        ];
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
            $rematador = Rematador::where('usuario_id', $usuario->id)->first();
            
            if (!$cliente && !$rematador) {
                return response()->json(['error' => 'Usuario no encontrado'], 404);
            }

            $notificacion = null;
            if ($cliente) {
                $notificacion = $cliente->notificaciones()->find($id);
                if ($notificacion) {
                    $cliente->notificaciones()->updateExistingPivot($id, ['leido' => true]);
                }
            } else if ($rematador) {
                $notificacion = $rematador->notificaciones()->find($id);
                if ($notificacion) {
                    $rematador->notificaciones()->updateExistingPivot($id, ['leido' => true]);
                }
            }
            
            if (!$notificacion) {
                return response()->json(['error' => 'Notificación no encontrada'], 404);
            }

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
            $rematador = Rematador::where('usuario_id', $usuario->id)->first();
            
            if (!$cliente && !$rematador) {
                return response()->json(['error' => 'Usuario no encontrado'], 404);
            }

            if ($cliente) {
                $cliente->notificaciones()->updateExistingPivot(
                    $cliente->notificaciones()->pluck('notificaciones.id'),
                    ['leido' => true]
                );
            } else if ($rematador) {
                $rematador->notificaciones()->updateExistingPivot(
                    $rematador->notificaciones()->pluck('notificaciones.id'),
                    ['leido' => true]
                );
            }

            return response()->json(['mensaje' => 'Todas las notificaciones marcadas como leídas']);

        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'Error al marcar notificaciones como leídas',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crea una nueva notificación para uno o varios usuarios
     * 
     * @param array $usuarioIds Array de IDs de usuarios que recibirán la notificación
     * @param string $titulo Título de la notificación
     * @param string $mensaje Contenido de la notificación
     * @param bool $esMensajeChat Si la notificación corresponde a un mensaje de chat
     * @return Notificacion
     */
    public static function createNotificacion(
        array $usuarioIds,
        string $titulo,
        string $mensaje,
        bool $esMensajeChat = false
    ): Notificacion 
    {
        try {
            $notificacion = Notificacion::create([
                'titulo' => $titulo,
                'mensaje' => $mensaje,
                'es_mensaje_chat' => $esMensajeChat,
                'fecha_hora' => now()
            ]);

            // Clasificar usuarios por tipo y asociar la notificación
            foreach ($usuarioIds as $usuarioId) {
                $cliente = Cliente::where('usuario_id', $usuarioId)->first();
                $rematador = Rematador::where('usuario_id', $usuarioId)->first();

                if ($cliente) {
                    $notificacion->clientes()->attach($usuarioId, ['leido' => false]);
                }
                if ($rematador) {
                    $notificacion->rematadores()->attach($usuarioId, ['leido' => false]);
                }
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
            // Por ahora solo devolemos una respuesta exitosa
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
            // Por ahora solo devolemos una respuesta exitosa
            return response()->json(['message' => 'Todas las notificaciones marcadas como leídas']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al marcar notificaciones'], 500);
        }
    }

    /**
     * @OA\Post(
     *     path="/api/notificaciones",
     *     summary="Crear una nueva notificación",
     *     tags={"Notificaciones"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"titulo", "mensaje", "usuarioIds"},
     *             @OA\Property(property="titulo", type="string", example="Nueva subasta disponible"),
     *             @OA\Property(property="mensaje", type="string", example="Se ha publicado una nueva subasta que podría interesarte"),
     *             @OA\Property(property="usuarioIds", type="array", @OA\Items(type="integer"), example={1,2,3}),
     *             @OA\Property(property="esMensajeChat", type="boolean", example=false)
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Notificación creada exitosamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="id", type="integer"),
     *             @OA\Property(property="titulo", type="string"),
     *             @OA\Property(property="mensaje", type="string"),
     *             @OA\Property(property="fecha_hora", type="string", format="date-time"),
     *             @OA\Property(property="es_mensaje_chat", type="boolean")
     *         )
     *     ),
     *     @OA\Response(response=422, description="Error de validación"),
     *     @OA\Response(response=500, description="Error del servidor")
     * )
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'titulo' => 'required|string|max:255',
                'mensaje' => 'required|string',
                'usuarioIds' => 'required|array',
                'usuarioIds.*' => 'integer|exists:usuarios,id',
                'esMensajeChat' => 'boolean'
            ]);

            $notificacion = self::createNotificacion(
                usuarioIds: $validated['usuarioIds'],
                titulo: $validated['titulo'],
                mensaje: $validated['mensaje'],
                esMensajeChat: $validated['esMensajeChat'] ?? false
            );

            return response()->json($notificacion, 201);

        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'Error al crear la notificación',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
