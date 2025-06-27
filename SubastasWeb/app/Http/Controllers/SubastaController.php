<?php

namespace App\Http\Controllers;

use App\Models\Subasta;
use App\Models\Lote;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Mail\NotificacionCorreo;
use Illuminate\Support\Facades\Mail;


/**
 * @OA\Tag(
 *     name="Subastas",
 *     description="API para gestionar subastas"
 * )
 */
class SubastaController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/subastas",
     *     summary="Obtener todas las subastas",
     *     tags={"Subastas"},
     *     @OA\Response(
     *         response=200,
     *         description="Lista de subastas"
     *     )
     * )
     */
    public function index() {
        try {
            $subastas = Subasta::with([
                'casaRemate.usuario', 
                'rematador', 
                'lotes.pujas.cliente.usuario', 
                'lotes.articulos.categoria',
                'lotes.articulos.vendedor'
            ])->get();
            
            return response()->json($subastas);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
        
    }


    /**
     * @OA\Post(
     *     path="/api/subastas",
     *     summary="Crear una nueva subasta",
     *     tags={"Subastas"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"duracionMinutos", "fecha", "casa_remate_id", "rematador_id"},
     *             @OA\Property(property="nombre", type="string"),
     *             @OA\Property(property="duracionMinutos", type="integer"),
     *             @OA\Property(property="activa", type="boolean"),
     *             @OA\Property(property="fecha", type="string", format="date-time", example="2025-06-01T14:00:00Z"),
     *             @OA\Property(property="casa_remate_id", type="integer"),
     *             @OA\Property(property="rematador_id", type="integer"),
     *             @OA\Property(property="latitud", type="number", format="float"),
     *             @OA\Property(property="longitud", type="number", format="float"),
     *             @OA\Property(property="videoId", type="string", nullable=true)
     *         )
     *     ),
     *     @OA\Response(response=201, description="Subasta creada exitosamente"),
     *     @OA\Response(response=422, description="Error de validación")
     * )
     */
    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string',
            'activa' => 'required|boolean',
            'duracionMinutos' => 'required|integer|min:1',
            'fecha'           => 'required|date',
            'timezone'        => 'nullable|string', // Zona horaria opcional
            'casa_remate_id'   => 'nullable|exists:casa_remates,usuario_id',
            'rematador_id'    => 'nullable|exists:rematadores,usuario_id',
            'latitud'         => 'nullable|numeric|between:-90,90',
            'longitud'        => 'nullable|numeric|between:-180,180',
            'videoId'         => 'nullable|string|max:255',
        ]);

        // Convertir fecha de zona horaria del usuario a UTC
        $fecha = $request->fecha;
        if ($request->has('timezone')) {
            try {
                $fechaLocal = \Carbon\Carbon::parse($fecha, $request->timezone);
                $fecha = $fechaLocal->utc()->format('Y-m-d H:i:s');
            } catch (\Exception $e) {
                // Si hay error, usar la fecha original
                \Log::warning('Error al convertir zona horaria: ' . $e->getMessage());
            }
        }

        $subasta = Subasta::create([
            'nombre' => $request->nombre,
            'activa' => $request->activa,
            'duracionMinutos' => $request->duracionMinutos,
            'fecha' => $fecha, // Fecha convertida a UTC
            'casa_remate_id' => $request->casa_remate_id,
            'rematador_id' => $request->rematador_id,
            'latitud' => $request->latitud,
            'longitud' => $request->longitud,
            'videoId' => $request->videoId
        ]);

        if ($request->has('direccion')) {
            $subasta->direccion()->create($request->input('direccion'));
        }

        return response()->json($subasta->load(['casaRemate', 'rematador']), 201);

    }

    /**
     * @OA\Get(
     *     path="/api/subastas/{id}",
     *     summary="Obtener una subasta por ID",
     *     tags={"Subastas"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Subasta encontrada"),
     *     @OA\Response(response=404, description="Subasta no encontrada")
     * )
     */
    public function show($id){
        /** @var Subasta|null $subasta */
        $subasta = Subasta::with([
            'casaRemate.usuario', 
            'rematador', 
            'lotes.pujas.cliente.usuario', 
            'lotes.articulos.categoria',
            'lotes.articulos.vendedor'
        ])->find($id);

        if (!$subasta) {
            return response()->json(['message' => 'Subasta no encontrada'], 404);
        }

        // Ordenar los lotes por id ascendente antes de devolver la subasta
        if ($subasta->relationLoaded('lotes') && $subasta->lotes) {
            // Convertir a array, ordenar y volver a Collection para evitar problemas de claves
            $lotesOrdenados = $subasta->lotes->sortBy(function($lote) {
                return (int) $lote->id;
            })->values();
            $subasta->setRelation('lotes', $lotesOrdenados);
        }

        return response()->json($subasta);
    }

    /**
     * @OA\Put(
     *     path="/api/subastas/{id}",
     *     summary="Actualizar una subasta",
     *     tags={"Subastas"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="nombre", type="string"),
     *             @OA\Property(property="duracionMinutos", type="integer"),
     *             @OA\Property(property="activa", type="boolean"),
     *             @OA\Property(property="fecha", type="string", format="date-time", example="2025-06-01T14:00:00Z"),
     *             @OA\Property(property="casa_remate_id", type="integer"),
     *             @OA\Property(property="rematador_id", type="integer"),
     *             @OA\Property(property="latitud", type="number", format="float"),
     *             @OA\Property(property="longitud", type="number", format="float"),
     *             @OA\Property(property="videoId", type="string", nullable=true),
     *             @OA\Property(property="loteIndex", type="integer", minimum=0, nullable=true)
     *         )
     *     ),
     *     @OA\Response(response=200, description="Subasta actualizada"),
     *     @OA\Response(response=404, description="Subasta no encontrada"),
     *     @OA\Response(response=422, description="Error de validación")
     * )
     */
    public function update(Request $request, $id)
    {
        try {
            $subasta = Subasta::find($id);

            if (!$subasta) {
                return response()->json(['message' => 'Subasta no encontrada'], 404);
            }

            $request->validate([
                'nombre' => 'sometimes|required|string',
                'activa' => 'sometimes|required|boolean',
                'duracionMinutos' => 'sometimes|required|integer|min:1',
                'fecha'           => 'nullable|date',
                'casa_remate_id'   => 'nullable|exists:casa_remates,usuario_id',
                'rematador_id'    => 'nullable|exists:rematadores,usuario_id',
                'latitud'         => 'nullable|numeric|between:-90,90',
                'longitud'        => 'nullable|numeric|between:-180,180',
                'videoId'         => 'nullable|string|max:255',
                'loteIndex'       => 'nullable|integer|min:0',
                'lotes'           => 'sometimes|array',
                'lotes.*.id'      => 'sometimes|required|integer|exists:lotes,id',
                'lotes.*.pago'    => 'sometimes|required|boolean',
            ]);

            // Filtrar solo los campos que están presentes en la request
            $dataToUpdate = array_filter($request->only([
                'nombre',
                'activa',
                'duracionMinutos',
                'fecha',
                'casa_remate_id',
                'rematador_id',
                'latitud',
                'longitud',
                'videoId',
                'loteIndex'
            ]), function($value) {
                return $value !== null;
            });

            $subasta->update($dataToUpdate); 

            // Handle lotes update if provided
            if ($request->has('lotes') && is_array($request->lotes)) {
                foreach ($request->lotes as $loteData) {
                    if (isset($loteData['id'])) {
                        $lote = Lote::find($loteData['id']);
                        if ($lote && $lote->subasta_id == $subasta->id) {
                            // Update only the fields that are present in the request
                            $loteUpdateData = array_filter([
                                'pago' => $loteData['pago'] ?? null,
                                'valorBase' => $loteData['valorBase'] ?? null,
                                'pujaMinima' => $loteData['pujaMinima'] ?? null,
                                'umbral' => $loteData['umbral'] ?? null,
                            ], function($value) {
                                return $value !== null;
                            });
                            
                            if (!empty($loteUpdateData)) {
                                $lote->update($loteUpdateData);
                            }
                        }
                    }
                }
            }

            // Load the complete subasta with its related data including updated lotes
            $updatedSubasta = $subasta->load([
                'casaRemate.usuario', 
                'rematador', 
                'lotes.pujas.cliente.usuario', 
                'lotes.articulos.categoria',
                'lotes.articulos.vendedor'
            ]);

            return response()->json($updatedSubasta);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error interno del servidor',
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null
            ], 500);
        }
    }

    /**
     * @OA\Delete(
     *     path="/api/subastas/{id}",
     *     summary="Eliminar una subasta por ID",
     *     tags={"Subastas"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Subasta eliminada correctamente"),
     *     @OA\Response(response=404, description="Subasta no encontrada")
     * )
     */
    public function destroy($id)
    {
        $subasta = Subasta::find($id);

        if (!$subasta) {
            return response()->json(['message' => 'Subasta no encontrada'], 404);
        }

        // Elimina los lotes relacionados (si así lo querés)
        $subasta->lotes()->delete();

        // Elimina la subasta
        $subasta->delete();

        return response()->json(['message' => 'Subasta eliminada correctamente']);
    }


    /**
     * @OA\Post(
     *     path="/api/subastas/{id}/lotes",
     *     summary="Asociar lotes a una subasta",
     *     tags={"Subastas"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"lotes"},
     *             @OA\Property(property="lotes", type="array", @OA\Items(type="integer"))
     *         )
     *     ),
     *     @OA\Response(response=200, description="Lotes asociados exitosamente"),
     *     @OA\Response(response=404, description="Subasta no encontrada"),
     *     @OA\Response(response=422, description="Error de validación")
     * )
     */
    public function agregarLotes(Request $request, $id)
    {
        $subasta = Subasta::find($id);

        if (!$subasta) {
            return response()->json(['message' => 'Subasta no encontrada'], 404);
        }

        $validator = Validator::make($request->all(), [
            'lotes' => 'required|array|min:1',
            'lotes.*' => 'exists:lotes,id'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        foreach ($request->lotes as $loteId) {
            $lote = Lote::find($loteId);
            if ($lote) {
                $lote->subasta_id = $subasta->id;
                $lote->save();
            }
        }

        return response()->json([
            'message' => 'Lotes asociados exitosamente',
            'subasta' => $subasta->load('lotes')
        ]);
    }

    /**
     * @OA\Post(
     *     path="/api/subastas/enviaMail",
     *     summary="Envía una notificación por email",
     *     description="Envía un email de notificación con asunto y mensaje personalizados",
     *     tags={"Subastas"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"email", "asunto", "mensaje"},
     *             @OA\Property(property="email", type="string", format="email", description="Dirección de email del destinatario"),
     *             @OA\Property(property="asunto", type="string", description="Asunto del email"),
     *             @OA\Property(property="mensaje", type="string", description="Contenido del mensaje")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Email enviado exitosamente"),
     *     @OA\Response(response=422, description="Error de validación"),
     *     @OA\Response(response=500, description="Error interno del servidor")
     * )
     */
    public function enviarEmailNotificacion(Request $request){
        $request->validate([
            'email' => 'required|email',
            'asunto' => 'required|string|max:255',
            'mensaje' => 'required|string'
        ]);

        try {
            Mail::to($request->email)->send(new NotificacionCorreo($request->asunto, $request->mensaje));
            return response()->json(['message' => 'Email enviado exitosamente']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al enviar el email: ' . $e->getMessage()], 500);
        }
    }
}