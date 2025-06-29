<?php

namespace App\Http\Controllers;

use App\Models\CasaRemate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * @OA\Tag(
 *     name="CasaRemates",
 *     description="API para gestionar casas de remate"
 * )
 */
class CasaRemateController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/casa-remates",
     *     summary="Obtener todas las casas de remate",
     *     tags={"CasaRemates"},
     *     @OA\Response(response=200, description="Lista de casas de remate")
     * )
     */
    public function index()
    {
        $casas = CasaRemate::with(['rematadores', 'subastas', 'valoracion', 'usuario'])->get();
        return response()->json($casas);
    }

    /**
     * @OA\Post(
     *     path="/api/casa-remates",
     *     summary="Crear una nueva casa de remate",
     *     tags={"CasaRemates"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"usuario_id", "idFiscal"},
     *             @OA\Property(property="usuario_id", type="integer"),
     *             @OA\Property(property="idFiscal", type="string", maxLength=20)
     *         )
     *     ),
     *     @OA\Response(response=201, description="Casa de remate creada exitosamente"),
     *     @OA\Response(response=422, description="Error de validación")
     * )
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'usuario_id' => 'required|exists:usuarios,id|unique:casa_remates,usuario_id',
            'idFiscal' => 'required|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $casa = CasaRemate::create($request->only(['usuario_id', 'idFiscal']));

        return response()->json($casa, 201);
    }

    /**
     * @OA\Get(
     *     path="/api/casa-remates/{usuario_id}",
     *     summary="Obtener una casa de remate por ID",
     *     tags={"CasaRemates"},
     *     @OA\Parameter(
     *         name="usuario_id",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Casa de remate encontrada"),
     *     @OA\Response(response=404, description="Casa de remate no encontrada")
     * )
     */
    public function show(string $usuario_id)
    {
        $casa = CasaRemate::with(['rematadores', 'subastas', 'valoracion', 'usuario'])->find($usuario_id);

        if (!$casa) {
            return response()->json(['message' => 'Casa de remate no encontrada'], 404);
        }

        return response()->json($casa);
    }

    /**
     * @OA\Put(
     *     path="/api/casa-remates/{usuario_id}",
     *     summary="Actualizar una casa de remate",
     *     tags={"CasaRemates"},
     *     @OA\Parameter(
     *         name="usuario_id",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="idFiscal", type="string", maxLength=20)
     *         )
     *     ),
     *     @OA\Response(response=200, description="Casa de remate actualizada"),
     *     @OA\Response(response=404, description="Casa de remate no encontrada"),
     *     @OA\Response(response=422, description="Error de validación")
     * )
     */
    public function update(Request $request, string $usuario_id)
    {
        $casa = CasaRemate::find($usuario_id);

        if (!$casa) {
            return response()->json(['message' => 'Casa de remate no encontrada'], 404);
        }

        $validator = Validator::make($request->all(), [
            'idFiscal' => 'sometimes|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $casa->update($request->only(['idFiscal']));

        return response()->json([
            'mensaje' => 'Casa de remate actualizada exitosamente.',
            'casaRemate' => $casa
        ]);
    }

    /**
     * @OA\Delete(
     *     path="/api/casa-remates/{usuario_id}",
     *     summary="Eliminar una casa de remate por ID",
     *     tags={"CasaRemates"},
     *     @OA\Parameter(
     *         name="usuario_id",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Casa de remate eliminada"),
     *     @OA\Response(response=404, description="Casa de remate no encontrada")
     * )
     */
    public function destroy(string $usuario_id)
    {
        $casa = CasaRemate::find($usuario_id);

        if (!$casa) {
            return response()->json(['message' => 'Casa de remate no encontrada'], 404);
        }

        $casa->delete();

        return response()->json(['message' => 'Casa de remate eliminada']);
    }

    /**
     * @OA\Post(
     *     path="/api/casa-remates/{usuario_id}/asociar-rematadores",
     *     summary="Asociar rematadores a una casa de remate",
     *     tags={"CasaRemates"},
     *     @OA\Parameter(
     *         name="usuario_id",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"rematadores"},
     *             @OA\Property(property="rematadores", type="array", @OA\Items(type="integer"))
     *         )
     *     ),
     *     @OA\Response(response=200, description="Rematadores asociados exitosamente"),
     *     @OA\Response(response=404, description="Casa de remate no encontrada"),
     *     @OA\Response(response=422, description="Validación fallida")
     * )
     */
    public function asociarRematadores(Request $request, string $usuario_id)
    {
        $casa = CasaRemate::find($usuario_id);

        if (!$casa) {
            return response()->json(['message' => 'Casa de remate no encontrada'], 404);
        }

        $validator = Validator::make($request->all(), [
            'rematadores' => 'required|array',
            'rematadores.*' => 'integer|exists:rematadores,id'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $casa->rematadores()->sync($request->rematadores);

        return response()->json([
            'message' => 'Rematadores asociados exitosamente',
            'casa_remate' => $casa->load('rematadores')
        ]);
    }

    /**
     * @OA\Post(
     *     path="/api/casa-remates/{usuario_id}/calificar",
     *     summary="Agregar una calificación a una casa de remate",
     *     tags={"CasaRemates"},
     *     @OA\Parameter(
     *         name="usuario_id",
     *         in="path",
     *         required=true,
     *         description="ID de la casa de remate",
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"valor"},
     *             @OA\Property(property="valor", type="integer", minimum=1, maximum=5, example=4)
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Calificación agregada exitosamente",
     *         @OA\JsonContent(
     *             @OA\Property(property="mensaje", type="string"),
     *             @OA\Property(property="promedio", type="number", format="float"),
     *             @OA\Property(property="total_opiniones", type="integer"),
     *             @OA\Property(property="estrellas", type="integer")
     *         )
     *     ),
     *     @OA\Response(response=404, description="Casa de remate no encontrada"),
     *     @OA\Response(response=422, description="Error de validación")
     * )
     */
    public function calificar(Request $request, string $usuario_id)
    {
        $request->validate([
            'valor' => 'required|integer|min:1|max:5',
        ]);

        $casa = CasaRemate::with('valoracion')->find($usuario_id);

        if (!$casa) {
            return response()->json(['message' => 'Casa de remate no encontrada'], 404);
        }

        // Obtener o crear la valoración
        $valoracion = $casa->valoracion ?? $casa->valoracion()->create([
            'valoracion_total' => 0,
            'cantidad_opiniones' => 0,
        ]);

        $valoracion->agregarValoracion($request->valor);

        return response()->json([
            'mensaje' => 'Calificación agregada exitosamente.',
            'promedio' => $valoracion->promedio,
            'total_opiniones' => $valoracion->cantidad_opiniones,
            'estrellas' => $valoracion->estrellas,
        ]);
    }

}
