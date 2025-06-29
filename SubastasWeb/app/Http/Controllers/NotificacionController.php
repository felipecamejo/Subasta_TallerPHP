<?php

namespace App\Http\Controllers;

use App\Models\Notificacion;
use App\Models\Cliente;
use App\Models\Rematador;
use App\Models\Usuario;
use App\Models\CasaRemate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use OpenApi\Annotations as OA;

/**
 * @OA\Tag(
 *     name="Notificaciones",
 *     description="API para gestionar notificaciones"
 * )
 */
class NotificacionController extends Controller
{
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
        } elseif ($casa) {
            $notificaciones = $casa->notificaciones()
                ->orderBy('fecha_hora', 'desc')
                ->get()
                ->map(fn($n) => $this->formatNotification($n, $casa->usuario));
        } else {
            // Admins no reciben notificaciones por ahora
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
            'chatId' => $notificacion->chat_id,
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
            $casaRemate = \App\Models\CasaRemate::where('usuario_id', $usuario->id)->first();
            
            if (!$cliente && !$rematador && !$casaRemate) {
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
            } else if ($casaRemate) {
                $notificacion = $casaRemate->notificaciones()->find($id);
                if ($notificacion) {
                    $casaRemate->notificaciones()->updateExistingPivot($id, ['leido' => true]);
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
            $casaRemate = \App\Models\CasaRemate::where('usuario_id', $usuario->id)->first();
            
            if (!$cliente && !$rematador && !$casaRemate) {
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
            } else if ($casaRemate) {
                $casaRemate->notificaciones()->updateExistingPivot(
                    $casaRemate->notificaciones()->pluck('notificaciones.id'),
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
        bool $esMensajeChat = false,
        string $chatId = null
    ): Notificacion 
    {
        try {
            $notificacion = Notificacion::create([
                'titulo' => $titulo,
                'mensaje' => $mensaje,
                'es_mensaje_chat' => $esMensajeChat,
                'chat_id' => $chatId,
                'fecha_hora' => now()
            ]);

            // Clasificar usuarios por tipo y asociar la notificación
            foreach ($usuarioIds as $usuarioId) {
                $cliente = Cliente::where('usuario_id', $usuarioId)->first();
                $rematador = Rematador::where('usuario_id', $usuarioId)->first();
                $casaRemate = \App\Models\CasaRemate::where('usuario_id', $usuarioId)->first();

                if ($cliente) {
                    $notificacion->clientes()->attach($cliente->usuario_id, ['leido' => false]);
                }
                if ($rematador) {
                    $notificacion->rematadores()->attach($rematador->usuario_id, ['leido' => false]);
                }
                if ($casaRemate) {
                    $notificacion->casaRemates()->attach($casaRemate->usuario_id, ['leido' => false]);
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
                'esMensajeChat' => 'boolean',
                'chatId' => 'nullable|string'
            ]);

            $notificacion = self::createNotificacion(
                usuarioIds: $validated['usuarioIds'],
                titulo: $validated['titulo'],
                mensaje: $validated['mensaje'],
                esMensajeChat: $validated['esMensajeChat'] ?? false,
                chatId: $validated['chatId'] ?? null
            );

            return response()->json($notificacion, 201);

        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'Error al crear la notificación',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Endpoint público para crear notificaciones de chat (solo para pruebas)
     */
    public function crearNotificacionChatPublico(Request $request)
    {
        try {
            $validated = $request->validate([
                'usuario1Id' => 'required|integer',
                'usuario1Nombre' => 'required|string',
                'usuario2Id' => 'required|integer',
                'usuario2Nombre' => 'required|string'
            ]);

            // Generar chatId
            $menorId = min($validated['usuario1Id'], $validated['usuario2Id']);
            $mayorId = max($validated['usuario1Id'], $validated['usuario2Id']);
            $chatId = "private_{$menorId}_{$mayorId}";

            // Crear notificación para usuario 1
            $titulo1 = "Chat privado con {$validated['usuario2Nombre']}";
            $mensaje1 = "Tienes una nueva conversación privada con {$validated['usuario2Nombre']}. Haz clic para abrir el chat.";
            
            $notificacion1 = Notificacion::create([
                'titulo' => $titulo1,
                'mensaje' => $mensaje1,
                'es_mensaje_chat' => true,
                'chat_id' => $chatId,
                'fecha_hora' => now()
            ]);

            // Crear notificación para usuario 2
            $titulo2 = "Chat privado con {$validated['usuario1Nombre']}";
            $mensaje2 = "Tienes una nueva conversación privada con {$validated['usuario1Nombre']}. Haz clic para abrir el chat.";
            
            $notificacion2 = Notificacion::create([
                'titulo' => $titulo2,
                'mensaje' => $mensaje2,
                'es_mensaje_chat' => true,
                'chat_id' => $chatId,
                'fecha_hora' => now()
            ]);

            // Asociar notificaciones a usuarios (buscar si son clientes o rematadores)
            // Usuario 1 recibe notificacion1
            $cliente1 = Cliente::where('usuario_id', $validated['usuario1Id'])->first();
            $rematador1 = Rematador::where('usuario_id', $validated['usuario1Id'])->first();

            if ($cliente1) {
                $notificacion1->clientes()->attach($cliente1->id, ['leido' => false]);
            }
            if ($rematador1) {
                $notificacion1->rematadores()->attach($rematador1->id, ['leido' => false]);
            }

            // Usuario 2 recibe notificacion2
            $cliente2 = Cliente::where('usuario_id', $validated['usuario2Id'])->first();
            $rematador2 = Rematador::where('usuario_id', $validated['usuario2Id'])->first();

            if ($cliente2) {
                $notificacion2->clientes()->attach($cliente2->id, ['leido' => false]);
            }
            if ($rematador2) {
                $notificacion2->rematadores()->attach($rematador2->id, ['leido' => false]);
            }

            return response()->json([
                'chatId' => $chatId,
                'mensaje' => 'Invitaciones de chat creadas correctamente',
                'notificaciones' => [
                    [
                        'id' => $notificacion1->id,
                        'usuario_id' => $validated['usuario1Id'],
                        'titulo' => $titulo1
                    ],
                    [
                        'id' => $notificacion2->id,
                        'usuario_id' => $validated['usuario2Id'],
                        'titulo' => $titulo2
                    ]
                ]
            ], 201);

        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'Error al crear las notificaciones de chat',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener notificaciones por usuario ID (endpoint público para pruebas)
     */
    public function obtenerNotificacionesPublico($usuarioId)
    {
        try {
            $cliente = Cliente::where('usuario_id', $usuarioId)->first();
            $rematador = Rematador::where('usuario_id', $usuarioId)->first();
            $casaRemate = CasaRemate::where('usuario_id', $usuarioId)->first();
            
            $notificaciones = [];
            
            if ($cliente) {
                $notificaciones = $cliente->notificaciones()
                    ->orderBy('fecha_hora', 'desc')
                    ->get()
                    ->map(function ($notificacion) use ($cliente) {
                        return [
                            'id' => $notificacion->id,
                            'titulo' => $notificacion->titulo,
                            'mensaje' => $notificacion->mensaje,
                            'fechaHora' => $notificacion->fecha_hora,
                            'leido' => $notificacion->pivot->leido,
                            'esMensajeChat' => $notificacion->es_mensaje_chat,
                            'chatId' => $notificacion->chat_id,
                            'usuario' => [
                                'id' => $cliente->usuario->id,
                                'nombre' => $cliente->usuario->nombre
                            ]
                        ];
                    });
            } elseif ($rematador) {
                $notificaciones = $rematador->notificaciones()
                    ->orderBy('fecha_hora', 'desc')
                    ->get()
                    ->map(function ($notificacion) use ($rematador) {
                        return [
                            'id' => $notificacion->id,
                            'titulo' => $notificacion->titulo,
                            'mensaje' => $notificacion->mensaje,
                            'fechaHora' => $notificacion->fecha_hora,
                            'leido' => $notificacion->pivot->leido,
                            'esMensajeChat' => $notificacion->es_mensaje_chat,
                            'chatId' => $notificacion->chat_id,
                            'usuario' => [
                                'id' => $rematador->usuario->id,
                                'nombre' => $rematador->usuario->nombre
                            ]
                        ];
                    });
            } elseif ($casaRemate) {
                $notificaciones = $casaRemate->notificaciones()
                    ->orderBy('fecha_hora', 'desc')
                    ->get()
                    ->map(function ($notificacion) use ($casaRemate) {
                        return [
                            'id' => $notificacion->id,
                            'titulo' => $notificacion->titulo,
                            'mensaje' => $notificacion->mensaje,
                            'fechaHora' => $notificacion->fecha_hora,
                            'leido' => $notificacion->pivot->leido,
                            'esMensajeChat' => $notificacion->es_mensaje_chat,
                            'chatId' => $notificacion->chat_id,
                            'usuario' => [
                                'id' => $casaRemate->usuario->id,
                                'nombre' => $casaRemate->usuario->nombre
                            ]
                        ];
                    });
            }

            return response()->json($notificaciones);

        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'Error al obtener notificaciones',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
