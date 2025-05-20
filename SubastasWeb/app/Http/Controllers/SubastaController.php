<?php

namespace App\Http\Controllers;

use App\Models\Subasta;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

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
     *         description="Lista de subastas",
     *         @OA\JsonContent(
     *             type="array",
     *             @OA\Items(
     *                 @OA\Property(property="id", type="integer"),
     *                 @OA\Property(property="duracionMinutos", type="integer"),
     *                 @OA\Property(property="fecha", type="string", format="date-time"),
     *                 @OA\Property(property="casaremate_id", type="integer"),
     *                 @OA\Property(property="rematador_id", type="integer"),
     *                 @OA\Property(property="latitud", type="number", format="float"),
     *                 @OA\Property(property="longitud", type="number", format="float"),
     *                 @OA\Property(property="created_at", type="string", format="date-time"),
     *                 @OA\Property(property="updated_at", type="string", format="date-time"),
     *                 @OA\Property(property="casaremate", type="object"),
     *                 @OA\Property(property="rematador", type="object"),
     *                 @OA\Property(property="direccion", type="object"),
     *                 @OA\Property(property="lotes", type="array", @OA\Items(type="object"))
     *             )
     *         )
     *     )
     * )
     */
    public function index()
    {
        return Subasta::with(['casaremate', 'rematador', 'direccion', 'lotes'])->get();
    }

    /**
     * @OA\Post(
     *     path="/api/subastas",
     *     summary="Crear una nueva subasta",
     *     tags={"Subastas"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"duracionMinutos", "fecha"},
     *             @OA\Property(property="duracionMinutos", type="integer"),
     *             @OA\Property(property="fecha", type="string", format="date-time"),
     *             @OA\Property(property="casaremate_id", type="integer"),
     *             @OA\Property(property="rematador_id", type="integer"),
     *             @OA\Property(property="latitud", type="number", format="float"),
     *             @OA\Property(property="longitud", type="number", format="float"),
     *             @OA\Property(property="direccion", type="object",
     *                 @OA\Property(property="calle1", type="string"),
     *                 @OA\Property(property="calle2", type="string"),
     *                 @OA\Property(property="numero", type="string"),
     *                 @OA\Property(property="ciudad", type="string"),
     *                 @OA\Property(property="pais", type="string")
     *             )
     *         )
     *     ),
     *     @OA\Response(response=201, description="Subasta creada exitosamente"),
     *     @OA\Response(response=422, description="Error de validación")
     * )
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'duracionMinutos' => 'required|integer|min:1',
            'fecha'           => 'required|date',
            'casaremate_id'   => 'sometimes|exists:casa_remates,id',
            'rematador_id'    => 'sometimes|exists:rematadores,id',
            'latitud'         => 'nullable|numeric|between:-90,90',
            'longitud'        => 'nullable|numeric|between:-180,180',
            'direccion'       => 'sometimes|array',
            'direccion.calle1' => 'required_with:direccion|string',
            'direccion.ciudad' => 'required_with:direccion|string',
            'direccion.pais'  => 'required_with:direccion|string'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $subasta = Subasta::create($request->only([
            'duracionMinutos',
            'fecha',
            'casaremate_id',
            'rematador_id',
            'latitud',
            'longitud'
        ]));

        if ($request->has('direccion')) {
            $subasta->direccion()->create($request->input('direccion'));
        }

        return response()->json($subasta->load(['casaremate', 'rematador', 'direccion']), 201);
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
    public function show($id)
    {
        $subasta = Subasta::with(['casaremate', 'rematador', 'direccion', 'lotes'])->find($id);

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
     *             @OA\Property(property="duracionMinutos", type="integer"),
     *             @OA\Property(property="fecha", type="string", format="date-time"),
     *             @OA\Property(property="casaremate_id", type="integer"),
     *             @OA\Property(property="rematador_id", type="integer"),
     *             @OA\Property(property="latitud", type="number", format="float"),
     *             @OA\Property(property="longitud", type="number", format="float"),
     *             @OA\Property(property="direccion", type="object"),
     *             @OA\Property(property="lotes", type="array", @OA\Items(type="integer"))
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

        $validator = Validator::make($request->all(), [
            'duracionMinutos' => 'sometimes|integer|min:1',
            'fecha'           => 'sometimes|date',
            'casaremate_id'   => 'sometimes|exists:casa_remates,id',
            'rematador_id'    => 'sometimes|exists:rematadores,id',
            'latitud'         => 'nullable|numeric|between:-90,90',
            'longitud'        => 'nullable|numeric|between:-180,180',
            'direccion'       => 'sometimes|array',
            'lotes'           => 'sometimes|array',
            'lotes.*'         => 'exists:lotes,id'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $subasta->update($request->only([
            'duracionMinutos',
            'fecha',
            'casaremate_id',
            'rematador_id',
            'latitud',
            'longitud'
        ]));

        if ($request->has('direccion')) {
            if ($subasta->direccion) {
                $subasta->direccion()->update($request->input('direccion'));
            } else {
                $subasta->direccion()->create($request->input('direccion'));
            }
        }

        if ($request->has('lotes')) {
            $subasta->lotes()->sync($request->input('lotes'));
        }

        return response()->json($subasta->load(['casaremate', 'rematador', 'direccion', 'lotes']));
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

        if ($subasta->direccion) {
            $subasta->direccion()->delete();
        }

        $subasta->lotes()->detach();
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

        $subasta->lotes()->syncWithoutDetaching($request->lotes);

        return response()->json([
            'message' => 'Lotes asociados exitosamente',
            'subasta' => $subasta->load('lotes')
        ]);
    }
}