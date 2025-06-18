<?php

namespace App\Http\Controllers;

use App\Models\Cliente;
use App\Models\Rematador;
use App\Models\Usuario;
use App\Models\Chat;
use App\Models\Mensaje;
use Illuminate\Http\Request;
use App\Http\Controllers\NotificacionController;
use OpenApi\Annotations as OA;

/**
 * @OA\Tag(
 *     name="Chat",
 *     description="API para gestionar chats privados"
 * )
 */
class ChatController extends Controller
{
    /**
     * @OA\Post(
     *     path="/api/chat/invitacion",
     *     summary="Crear invitación de chat entre dos usuarios",
     *     tags={"Chat"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"invitanteId", "invitanteNombre", "invitadoId", "invitadoNombre"},
     *             @OA\Property(property="invitanteId", type="integer", example=1),
     *             @OA\Property(property="invitanteNombre", type="string", example="Juan Pérez"),
     *             @OA\Property(property="invitadoId", type="integer", example=2),
     *             @OA\Property(property="invitadoNombre", type="string", example="María García")
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Invitación de chat creada exitosamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string", example="Invitaciones de chat creadas correctamente"),
     *             @OA\Property(property="chatId", type="string", example="private_1_2")
     *         )
     *     ),
     *     @OA\Response(response=400, description="Error de validación"),
     *     @OA\Response(response=500, description="Error del servidor")
     * )
     */
    public function crearInvitacion(Request $request) {
        try {
            $validated = $request->validate([
                'invitanteId' => 'required|integer',
                'invitanteNombre' => 'required|string|max:255',
                'invitadoId' => 'required|integer',
                'invitadoNombre' => 'required|string|max:255'
            ]);

            // Validar que los usuarios sean diferentes
            if ($validated['invitanteId'] === $validated['invitadoId']) {
                return response()->json([
                    'success' => false,
                    'message' => 'No puedes crear un chat contigo mismo'
                ], 400);
            }

            // Verificar que ambos usuarios existen
            $invitante = Usuario::find($validated['invitanteId']);
            $invitado = Usuario::find($validated['invitadoId']);

            if (!$invitante || !$invitado) {
                return response()->json([
                    'success' => false,
                    'message' => 'Uno o ambos usuarios no existen'
                ], 404);
            }

            // Generar chatId único basado en los IDs de usuario (ordenados)
            $menorId = min($validated['invitanteId'], $validated['invitadoId']);
            $mayorId = max($validated['invitanteId'], $validated['invitadoId']);
            $chatId = "private_{$menorId}_{$mayorId}";

            // Crear notificación para el invitante
            $this->crearNotificacionChat(
                $validated['invitanteId'],
                $validated['invitadoNombre'],
                $chatId
            );

            // Crear notificación para el invitado
            $this->crearNotificacionChat(
                $validated['invitadoId'],
                $validated['invitanteNombre'],
                $chatId
            );

            return response()->json([
                'success' => true,
                'message' => 'Invitaciones de chat creadas correctamente',
                'chatId' => $chatId
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Throwable $e) {
            \Log::error('Error al crear invitación de chat: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error interno del servidor'
            ], 500);
        }
    }

    /**
     * Crear notificación de chat para un usuario específico
     */
    private function crearNotificacionChat(int $usuarioId, string $nombreOtroUsuario, string $chatId): void
    {
        $titulo = "Chat privado con {$nombreOtroUsuario}";
        $mensaje = "Tienes una nueva conversación privada con {$nombreOtroUsuario}. Haz clic para abrir el chat.";
        
        NotificacionController::createNotificacion(
            usuarioIds: [$usuarioId],
            titulo: $titulo,
            mensaje: $mensaje,
            esMensajeChat: true,
            chatId: $chatId
        );
    }    /**
     * @OA\Get(
     *     path="/api/chat/{chatId}/validar",
     *     summary="Validar acceso a un chat",
     *     tags={"Chat"},
     *     @OA\Parameter(
     *         name="chatId",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="string"),
     *         example="private_1_2"
     *     ),
     *     @OA\Parameter(
     *         name="usuario_id",
     *         in="query",
     *         required=true,
     *         @OA\Schema(type="integer"),
     *         example=1
     *     ),     *     @OA\Response(
     *         response=200,
     *         description="Resultado de la validación de acceso",
     *         @OA\JsonContent(
     *             @OA\Property(property="valid", type="boolean", description="true si tiene acceso, false si no", example=true)
     *         )
     *     )
     * )
     */
    public function validarAccesoChat(Request $request, string $chatId)
    {
        try {
            $usuarioId = $request->query('usuario_id');
            
            if (!$usuarioId) {
                return response()->json(['valid' => false]);
            }

            // Validar formato del chatId
            if (!preg_match('/^private_(\d+)_(\d+)$/', $chatId, $matches)) {
                return response()->json(['valid' => false]);
            }

            $userId1 = (int)$matches[1];
            $userId2 = (int)$matches[2];
            $usuarioIdInt = (int)$usuarioId;

            // Verificar que el usuario tiene acceso a este chat
            if ($usuarioIdInt !== $userId1 && $usuarioIdInt !== $userId2) {
                return response()->json(['valid' => false]);
            }

            // Verificar que ambos usuarios existen
            $otroUsuarioId = ($usuarioIdInt === $userId1) ? $userId2 : $userId1;
            $otroUsuario = Usuario::find($otroUsuarioId);

            if (!$otroUsuario) {
                return response()->json(['valid' => false]);
            }

            return response()->json(['valid' => true]);

        } catch (\Throwable $e) {
            \Log::error('Error al validar acceso al chat: ' . $e->getMessage());
            return response()->json(['valid' => false]);
        }
    }

    /**
     * @OA\Post(
     *     path="/api/chat/{chatId}/mensaje",
     *     summary="Enviar un mensaje en un chat",
     *     tags={"Chat"},
     *     @OA\Parameter(
     *         name="chatId",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="string"),
     *         example="private_1_2"
     *     ),
     *     @OA\RequestBody(
     *         required=true,     *         @OA\JsonContent(
     *             required={"usuario_id", "contenido"},
     *             @OA\Property(property="usuario_id", type="integer", example=1),
     *             @OA\Property(property="contenido", type="string", example="Hola, ¿cómo estás?")
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Mensaje enviado exitosamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="mensaje", type="object")
     *         )
     *     ),
     *     @OA\Response(response=403, description="No tienes acceso a este chat"),
     *     @OA\Response(response=404, description="Chat no encontrado")
     * )     */    public function enviarMensaje(Request $request, string $chatId)
    {
        try {
            $validated = $request->validate([
                'usuario_id' => 'required|integer',
                'contenido' => 'required|string|max:1000'
            ]);

            // Buscar o crear el chat
            $chat = $this->buscarOCrearChat($chatId);
            
            if (!$chat) {
                return response()->json([
                    'success' => false,
                    'message' => 'Chat ID inválido'
                ], 400);
            }

            // Verificar que el usuario tiene acceso al chat
            if (!$chat->perteneceAlChat($validated['usuario_id'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes acceso a este chat'
                ], 403);
            }

            // Crear el mensaje
            $mensaje = Mensaje::create([
                'chat_id' => $chat->id,
                'usuario_id' => $validated['usuario_id'],
                'contenido' => $validated['contenido'],
                'tipo' => 'texto',
                'enviado_at' => now()
            ]);

            // Actualizar último mensaje del chat
            $chat->update([
                'ultimo_mensaje_at' => now()
            ]);

            // Cargar relaciones
            $mensaje->load('usuario');

            // Respuesta simple sin DTOs complejos
            return response()->json([
                'success' => true,
                'mensaje' => [
                    'id' => $mensaje->id,
                    'chat_id' => $mensaje->chat_id,
                    'usuario' => [
                        'id' => $mensaje->usuario->id,
                        'nombre' => $mensaje->usuario->nombre,
                        'email' => $mensaje->usuario->email
                    ],
                    'contenido' => $mensaje->contenido,
                    'enviado_at' => $mensaje->enviado_at->format('c'),
                    'leido' => $mensaje->leido,
                    'tipo' => $mensaje->tipo
                ]
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Throwable $e) {
            \Log::error('Error al enviar mensaje: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error interno del servidor'
            ], 500);
        }
    }    /**
     * @OA\Get(
     *     path="/api/chat/{chatId}/mensajes",
     *     summary="Obtener mensajes de un chat",
     *     tags={"Chat"},
     *     @OA\Parameter(
     *         name="chatId",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="string"),     *         example="private_1_2"
     *     ),
     *     @OA\Parameter(
     *         name="usuario_id",
     *         in="query",
     *         required=true,
     *         @OA\Schema(type="integer"),
     *         example=1
     *     ),
     *     @OA\Parameter(
     *         name="page",
     *         in="query",
     *         required=false,
     *         @OA\Schema(type="integer", minimum=1),
     *         example=1
     *     ),
     *     @OA\Parameter(
     *         name="limit",
     *         in="query",
     *         required=false,
     *         @OA\Schema(type="integer", minimum=1, maximum=100),
     *         example=50
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Lista de mensajes del chat",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="mensajes", type="array", @OA\Items(type="object")),
     *             @OA\Property(property="chat", type="object"),
     *             @OA\Property(property="pagination", type="object")
     *         )
     *     ),
     *     @OA\Response(response=403, description="No tienes acceso a este chat"),
     *     @OA\Response(response=404, description="Chat no encontrado")
     * )     */    public function obtenerMensajes(Request $request, string $chatId)
    {
        try {
            $usuarioId = $request->query('usuario_id');
            $page = $request->query('page', 1);
            $limit = min($request->query('limit', 100), 100);

            if (!$usuarioId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario ID requerido'
                ], 400);
            }

            // Buscar el chat
            $chat = $this->buscarOCrearChat($chatId);
            
            if (!$chat) {
                return response()->json([
                    'success' => false,
                    'message' => 'Chat no encontrado'
                ], 404);
            }

            // Verificar acceso
            if (!$chat->perteneceAlChat($usuarioId)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes acceso a este chat'
                ], 403);
            }

            // Obtener mensajes paginados
            $mensajes = Mensaje::where('chat_id', $chat->id)
                ->with('usuario')
                ->orderBy('enviado_at', 'desc')
                ->paginate($limit, ['*'], 'page', $page);

            // Mapear mensajes a formato simple
            $mensajesSimples = $mensajes->getCollection()->map(function($mensaje) {
                return [
                    'id' => $mensaje->id,
                    'chat_id' => $mensaje->chat_id,
                    'usuario' => [
                        'id' => $mensaje->usuario->id,
                        'nombre' => $mensaje->usuario->nombre,
                        'email' => $mensaje->usuario->email
                    ],
                    'contenido' => $mensaje->contenido,
                    'enviado_at' => $mensaje->enviado_at->format('c'),
                    'leido' => $mensaje->leido,
                    'tipo' => $mensaje->tipo
                ];
            });

            // Cargar datos básicos del chat
            $chat->load(['usuario1', 'usuario2']);
            $chatSimple = [
                'id' => $chat->id,
                'chat_id' => $chat->chat_id,
                'usuario1' => [
                    'id' => $chat->usuario1->id,
                    'nombre' => $chat->usuario1->nombre,
                    'email' => $chat->usuario1->email
                ],
                'usuario2' => [
                    'id' => $chat->usuario2->id,
                    'nombre' => $chat->usuario2->nombre,
                    'email' => $chat->usuario2->email
                ],
                'activo' => $chat->activo,
                'ultimo_mensaje_at' => $chat->ultimo_mensaje_at?->format('c')
            ];

            // Marcar mensajes como leídos (solo los que no son del usuario actual)
            Mensaje::where('chat_id', $chat->id)
                ->where('usuario_id', '!=', $usuarioId)
                ->where('leido', false)
                ->update(['leido' => true]);

            return response()->json([
                'success' => true,
                'mensajes' => $mensajesSimples->toArray(),
                'chat' => $chatSimple,
                'pagination' => [
                    'current_page' => $mensajes->currentPage(),
                    'last_page' => $mensajes->lastPage(),
                    'per_page' => $mensajes->perPage(),
                    'total' => $mensajes->total(),
                    'has_more_pages' => $mensajes->hasMorePages()
                ]
            ]);

        } catch (\Throwable $e) {
            \Log::error('Error al obtener mensajes: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error interno del servidor'
            ], 500);
        }
    }

    /**
     * Buscar o crear un chat basado en el chatId
     */    private function buscarOCrearChat(string $chatId): ?Chat {
        \Log::info('=== BUSCAR O CREAR CHAT ===');
        \Log::info('Chat ID: ' . $chatId);
        
        // Validar formato del chatId
        if (!preg_match('/^private_(\d+)_(\d+)$/', $chatId, $matches)) {
            \Log::error('Formato de chatId inválido: ' . $chatId);
            return null;
        }

        $userId1 = (int)$matches[1];
        $userId2 = (int)$matches[2];
        
        \Log::info('IDs extraídos: ' . $userId1 . ', ' . $userId2);

        // Verificar que los usuarios existen
        $usuario1 = Usuario::find($userId1);
        $usuario2 = Usuario::find($userId2);

        if (!$usuario1 || !$usuario2) {
            \Log::error('Usuarios no encontrados: ' . ($usuario1 ? 'Usuario1 OK' : 'Usuario1 NO') . ', ' . ($usuario2 ? 'Usuario2 OK' : 'Usuario2 NO'));
            return null;
        }

        \Log::info('Usuarios encontrados: ' . $usuario1->nombre . ', ' . $usuario2->nombre);

        // Buscar chat existente
        $chat = Chat::porUsuarios($userId1, $userId2)->first();

        // Si no existe, crearlo
        if (!$chat) {
            \Log::info('Chat no existe, creando nuevo...');
            $chat = Chat::create([
                'chat_id' => $chatId,
                'usuario1_id' => $userId1,
                'usuario2_id' => $userId2,
                'activo' => true
            ]);
            \Log::info('Chat creado con ID: ' . $chat->id);
        } else {
            \Log::info('Chat existente encontrado con ID: ' . $chat->id);
        }

        return $chat;
    }

    /**
     * @OA\Get(
     *     path="/api/chat/{chatId}/info",
     *     summary="Obtener información del chat",
     *     tags={"Chat"},
     *     @OA\Parameter(
     *         name="chatId",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="string"),     *         example="private_1_2"
     *     ),
     *     @OA\Parameter(
     *         name="usuario_id",
     *         in="query",
     *         required=true,
     *         @OA\Schema(type="integer"),
     *         example=1
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Información del chat",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="chat", type="object")
     *         )
     *     ),
     *     @OA\Response(response=403, description="No tienes acceso a este chat"),
     *     @OA\Response(response=404, description="Chat no encontrado")
     * )
     */    public function obtenerInfoChat(Request $request, string $chatId)
    {
        try {
            $usuarioId = $request->query('usuario_id');

            if (!$usuarioId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario ID requerido'
                ], 400);
            }

            // Buscar el chat
            $chat = $this->buscarOCrearChat($chatId);
            
            if (!$chat) {
                return response()->json([
                    'success' => false,
                    'message' => 'Chat no encontrado'
                ], 404);
            }

            // Verificar acceso
            if (!$chat->perteneceAlChat($usuarioId)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes acceso a este chat'
                ], 403);
            }            // Cargar relaciones
            $chat->load(['usuario1', 'usuario2', 'ultimoMensaje.usuario']);
            
            // Preparar datos del último mensaje si existe
            $ultimoMensaje = null;
            if ($chat->ultimoMensaje) {
                $ultimoMensaje = [
                    'id' => $chat->ultimoMensaje->id,
                    'contenido' => $chat->ultimoMensaje->contenido,
                    'enviado_at' => $chat->ultimoMensaje->enviado_at->format('c'),
                    'usuario' => [
                        'id' => $chat->ultimoMensaje->usuario->id,
                        'nombre' => $chat->ultimoMensaje->usuario->nombre
                    ]
                ];
            }

            // Respuesta simple sin DTOs complejos
            return response()->json([
                'success' => true,
                'chat' => [
                    'id' => $chat->id,
                    'chat_id' => $chat->chat_id,
                    'usuario1' => [
                        'id' => $chat->usuario1->id,
                        'nombre' => $chat->usuario1->nombre,
                        'email' => $chat->usuario1->email
                    ],
                    'usuario2' => [
                        'id' => $chat->usuario2->id,
                        'nombre' => $chat->usuario2->nombre,
                        'email' => $chat->usuario2->email
                    ],
                    'activo' => $chat->activo,
                    'ultimo_mensaje' => $ultimoMensaje,
                    'ultimo_mensaje_at' => $chat->ultimo_mensaje_at ? $chat->ultimo_mensaje_at->format('c') : null,
                    'created_at' => $chat->created_at->format('c')
                ]
            ]);

        } catch (\Throwable $e) {
            \Log::error('Error al obtener info del chat: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error interno del servidor'
            ], 500);
        }
    } 
        /**
     * @OA\Post(
     *     path="/api/chat/{chatId}/finalizar-chat",
     *     summary="Finalizar chat y opcionalmente calificar usuario",
     *     tags={"Chat"},
     *     @OA\Parameter(
     *         name="chatId",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="string"),
     *         example="private_1_2",
     *         description="ID del chat a finalizar"
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"usuario_id"},
     *             @OA\Property(property="usuario_id", type="integer", example=1, description="ID del usuario que finaliza el chat"),
     *             @OA\Property(property="usuario_valorable_id", type="integer", example=2, description="ID del usuario/casa de remate a calificar (opcional)"),
     *             @OA\Property(property="calificacion", type="integer", minimum=1, maximum=5, example=4, description="Calificación de 1 a 5 estrellas (opcional)"),
     *             @OA\Property(property="tipo_valorable", type="string", enum={"cliente", "casa_remate"}, example="cliente", description="Tipo de entidad a valorar (opcional)")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Chat finalizado correctamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string", example="Chat finalizado y calificación agregada."),
     *             @OA\Property(property="puede_valorar", type="boolean", example=true),
     *             @OA\Property(property="calificacion_agregada", type="boolean", example=true),
     *             @OA\Property(property="promedio_valoracion", type="number", format="float", example=4.2)
     *         )
     *     ),
     *     @OA\Response(
     *         response=403,
     *         description="No tienes acceso a este chat",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(property="message", type="string", example="No tienes acceso a este chat")
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Chat no encontrado",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(property="message", type="string", example="Chat no encontrado")
     *         )
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Error de validación",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(property="message", type="string", example="Error de validación"),
     *             @OA\Property(property="errors", type="object")
     *         )
     *     )
     * )     */
    public function finalizarChat(Request $request, $chatId)
    {
        try {
            // Validar entrada
            $validated = $request->validate([
                'usuario_id' => 'required|integer',
                'usuario_valorable_id' => 'nullable|integer',
                'calificacion' => 'nullable|integer|min:1|max:5',
                'tipo_valorable' => 'nullable|string|in:cliente,casa_remate'
            ]);

            // Buscar el chat por chat_id
            $chat = Chat::where('chat_id', $chatId)->first();
            
            if (!$chat) {
                return response()->json([
                    'success' => false,
                    'message' => 'Chat no encontrado'
                ], 404);
            }

            // Verificar que el usuario tenga acceso al chat
            if (!$chat->perteneceAlChat($validated['usuario_id'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes acceso a este chat'
                ], 403);
            }

            // Marcar el chat como inactivo (finalizado)
            $chat->update(['activo' => false]);

            $response = [
                'success' => true,
                'message' => 'Chat finalizado.',
                'puede_valorar' => true,
                'calificacion_agregada' => false
            ];            // Si se proporcionó información de calificación, procesarla
            if (isset($validated['usuario_valorable_id']) && 
                isset($validated['calificacion']) && 
                isset($validated['tipo_valorable'])) {
                
                $resultadoCalificacion = $this->procesarCalificacion(
                    $validated['usuario_valorable_id'],
                    $validated['calificacion'],
                    $validated['tipo_valorable']
                );

                if ($resultadoCalificacion['success']) {
                    // Guardar registro en chat_valoraciones para rastrear que este usuario ya valoró en este chat
                    \DB::table('chat_valoraciones')->insert([
                        'chat_id' => $chatId,
                        'valorador_id' => $validated['usuario_id'],
                        'valorado_id' => $validated['usuario_valorable_id'],
                        'puntuacion' => $validated['calificacion'],
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                    
                    $response['message'] = 'Chat finalizado y calificación agregada.';
                    $response['calificacion_agregada'] = true;
                    $response['promedio_valoracion'] = $resultadoCalificacion['promedio'];
                } else {
                    $response['message'] = 'Chat finalizado, pero hubo un error al agregar la calificación: ' . $resultadoCalificacion['message'];
                }
            }

            return response()->json($response);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Throwable $e) {
            \Log::error('Error al finalizar chat: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error interno del servidor'
            ], 500);
        }
    }

    /**
     * Procesar calificación para cliente o casa de remate
     */
    private function procesarCalificacion($usuarioId, $calificacion, $tipo)
    {
        try {
            if ($tipo === 'cliente') {
                // Buscar cliente
                $cliente = \App\Models\Cliente::find($usuarioId);
                if (!$cliente) {
                    return ['success' => false, 'message' => 'Cliente no encontrado'];
                }

                // Obtener o crear valoración para cliente
                $valoracion = $cliente->valoracion;
                if (!$valoracion) {
                    $valoracion = $cliente->valoracion()->create([
                        'valoracion_total' => $calificacion,
                        'cantidad_opiniones' => 1
                    ]);
                } else {
                    $valoracion->agregarValoracion($calificacion);
                }

                return [
                    'success' => true,
                    'promedio' => $valoracion->promedio,
                    'total_opiniones' => $valoracion->cantidad_opiniones
                ];

            } elseif ($tipo === 'casa_remate') {
                // Buscar casa de remate
                $casaRemate = \App\Models\CasaRemate::find($usuarioId);
                if (!$casaRemate) {
                    return ['success' => false, 'message' => 'Casa de remate no encontrada'];
                }

                // Obtener o crear valoración para casa de remate
                $valoracion = $casaRemate->valoracion;
                if (!$valoracion) {
                    $valoracion = $casaRemate->valoracion()->create([
                        'valoracion_total' => $calificacion,
                        'cantidad_opiniones' => 1
                    ]);
                } else {
                    $valoracion->agregarValoracion($calificacion);
                }

                return [
                    'success' => true,
                    'promedio' => $valoracion->promedio,
                    'total_opiniones' => $valoracion->cantidad_opiniones
                ];
            }

            return ['success' => false, 'message' => 'Tipo de valorable no válido'];

        } catch (\Throwable $e) {
            \Log::error('Error al procesar calificación: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Error al procesar calificación'];
        }
    }

    /**
     * @OA\Get(
     *     path="/api/chat/{chatId}/estado",
     *     summary="Verificar estado del chat y si necesita valoración",
     *     tags={"Chat"},
     *     @OA\Parameter(
     *         name="chatId",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="string"),
     *         description="ID del chat",
     *         example="private_1_2"
     *     ),
     *     @OA\Parameter(
     *         name="usuario_id",
     *         in="query",
     *         required=true,
     *         @OA\Schema(type="integer"),
     *         description="ID del usuario que hace la consulta",
     *         example=1
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Estado del chat obtenido exitosamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="chatFinalizado", type="boolean", example=true),
     *             @OA\Property(property="necesitaValoracion", type="boolean", example=true),
     *             @OA\Property(property="yaValoro", type="boolean", example=false),
     *             @OA\Property(
     *                 property="otroUsuario",
     *                 type="object",
     *                 @OA\Property(property="id", type="integer", example=2),
     *                 @OA\Property(property="nombre", type="string", example="María García"),
     *                 @OA\Property(property="tipo", type="string", example="cliente")
     *             )
     *         )
     *     ),
     *     @OA\Response(response=404, description="Chat no encontrado"),
     *     @OA\Response(response=500, description="Error del servidor")
     * )
     */
    public function verificarEstadoChat($chatId, Request $request)
    {
        try {
            $usuarioId = $request->query('usuario_id');
            
            if (!$usuarioId) {
                return response()->json(['error' => 'usuario_id es requerido'], 400);
            }
            
            // Verificar acceso al chat
            $chat = Chat::where('chat_id', $chatId)
                        ->where(function($query) use ($usuarioId) {
                            $query->where('usuario1_id', $usuarioId)
                                  ->orWhere('usuario2_id', $usuarioId);
                        })
                        ->first();
            
            if (!$chat) {
                return response()->json(['error' => 'Chat no encontrado'], 404);
            }            // Determinar el otro usuario
            $otroUsuarioId = $chat->usuario1_id == $usuarioId ? $chat->usuario2_id : $chat->usuario1_id;
            
            // Verificar si este chat está inactivo (finalizado)
            $chatFinalizado = !$chat->activo;
            
            // Verificar si ya valoró este usuario en este chat específico
            $yaValoro = \DB::table('chat_valoraciones')
                           ->where('chat_id', $chatId)
                           ->where('valorador_id', $usuarioId)
                           ->exists();
            
            // Verificar si el otro usuario ya valoró en este chat específico
            $otroUsuarioValoro = \DB::table('chat_valoraciones')
                                    ->where('chat_id', $chatId)
                                    ->where('valorador_id', $otroUsuarioId)
                                    ->exists();
            
            // Obtener información del otro usuario
            $otroUsuario = Usuario::find($otroUsuarioId);
            
            // Determinar tipo de usuario (simplificado)
            $tipoUsuario = 'cliente'; // Default
            if ($otroUsuario) {
                // Verificar si es un rematador
                $esRematador = Rematador::where('usuario_id', $otroUsuarioId)->exists();
                if ($esRematador) {
                    $tipoUsuario = 'casa_remate';
                }
            }
              return response()->json([
                'chatFinalizado' => $chatFinalizado,
                'necesitaValoracion' => $chatFinalizado && !$yaValoro,
                'yaValoro' => $yaValoro,
                'otroUsuarioValoro' => $otroUsuarioValoro,
                'otroUsuario' => [
                    'id' => $otroUsuarioId,
                    'nombre' => $otroUsuario->nombre ?? 'Usuario ' . $otroUsuarioId,
                    'tipo' => $tipoUsuario
                ]
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Error al verificar estado del chat: ' . $e->getMessage());
            return response()->json(['error' => 'Error interno del servidor'], 500);
        }
    }

   
}
