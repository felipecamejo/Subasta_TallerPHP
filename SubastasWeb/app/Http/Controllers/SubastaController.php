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
                'casaRemate.valoracion', 
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
            'casa_remate_id'   => 'nullable|exists:casa_remates,id',
            'rematador_id'    => 'nullable|exists:rematadores,id',
            'latitud'         => 'nullable|numeric|between:-90,90',
            'longitud'        => 'nullable|numeric|between:-180,180',
            'videoId'         => 'nullable|string|max:255',
        ]);

        $subasta = Subasta::create($request->only([
            'nombre',
            'activa',
            'duracionMinutos',
            'fecha',
            'casa_remate_id',
            'rematador_id',
            'latitud',
            'longitud',
            'videoId'
        ]));

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
            'casaRemate', 
            'rematador', 
            'lotes.pujas.cliente.usuario', 
            'lotes.articulos.categoria',
            'lotes.articulos.vendedor'
        ])->find($id);

        if (!$subasta) {
            return response()->json(['message' => 'Subasta no encontrada'], 404);
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
        $subasta = Subasta::find($id);

        if (!$subasta) {
            return response()->json(['message' => 'Subasta no encontrada'], 404);
        }

        $request->validate([
            'nombre' => 'required|string',
            'activa' => 'required|boolean',
            'duracionMinutos' => 'required|integer|min:1',
            'fecha'           => 'nullable|date',
            'casa_remate_id'   => 'nullable|exists:casa_remates,id',
            'rematador_id'    => 'nullable|exists:rematadores,id',
            'latitud'         => 'nullable|numeric|between:-90,90',
            'longitud'        => 'nullable|numeric|between:-180,180',
            'videoId'         => 'nullable|string|max:255',
            'loteIndex'       => 'required|integer|min:0',
        ]);

        $subasta->update($request->only([
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
        ])); 

        return response()->json($subasta->load(['casaRemate', 'rematador',]));
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