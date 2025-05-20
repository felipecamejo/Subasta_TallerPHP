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
        return response()->json(
            CasaRemate::with(['rematadores', 'subastas', 'direccion'])->get()
        );
    }

    /**
     * @OA\Post(
     *     path="/api/casa-remates",
     *     summary="Crear una nueva casa de remate",
     *     tags={"CasaRemates"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"nombre", "idFiscal", "email"},
     *             @OA\Property(property="nombre", type="string"),
     *             @OA\Property(property="idFiscal", type="string"),
     *             @OA\Property(property="email", type="string", format="email"),
     *             @OA\Property(property="telefono", type="string"),
     *             @OA\Property(property="calificacion", type="number", format="float"),
     *             @OA\Property(property="direccion", type="object",
     *                 @OA\Property(property="calle1", type="string"),
     *                 @OA\Property(property="calle2", type="string"),
     *                 @OA\Property(property="numero", type="string"),
     *                 @OA\Property(property="ciudad", type="string"),
     *                 @OA\Property(property="pais", type="string")
     *             )
     *         )
     *     ),
     *     @OA\Response(response=201, description="Casa de remate creada exitosamente"),
     *     @OA\Response(response=422, description="Error de validación")
     * )
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre'        => 'required|string|max:255',
            'idFiscal'      => 'required|string|max:20',
            'email'         => 'required|email|max:255',
            'telefono'      => 'nullable|string|max:20',
            'calificacion'  => 'nullable|numeric|min:0|max:5',
            'direccion'     => 'sometimes|array',
            'direccion.calle1' => 'required_with:direccion|string',
            'direccion.ciudad' => 'required_with:direccion|string',
            'direccion.pais' => 'required_with:direccion|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $casaRemate = CasaRemate::create($request->except('direccion'));

        if ($request->has('direccion') && !empty($request->direccion)) {
            $casaRemate->direccion()->create([
                'calle1' => $request->direccion['calle1'] ?? null,
                'calle2' => $request->direccion['calle2'] ?? null,
                'numero' => $request->direccion['numero'] ?? null,
                'ciudad' => $request->direccion['ciudad'],
                'pais' => $request->direccion['pais']
            ]);
        }

        return response()->json($casaRemate->load('direccion'), 201);
    }

    /**
     * @OA\Get(
     *     path="/api/casa-remates/{id}",
     *     summary="Obtener una casa de remate por ID",
     *     tags={"CasaRemates"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Casa de remate encontrada"),
     *     @OA\Response(response=404, description="Casa de remate no encontrada")
     * )
     */
    public function show(string $id)
    {
        $casaRemate = CasaRemate::with(['rematadores', 'subastas', 'direccion'])->find($id);

        if (!$casaRemate) {
            return response()->json(['message' => 'Casa de remate no encontrada'], 404);
        }

        return response()->json($casaRemate);
    }

    /**
     * @OA\Put(
     *     path="/api/casa-remates/{id}",
     *     summary="Actualizar una casa de remate",
     *     tags={"CasaRemates"},
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
     *             @OA\Property(property="idFiscal", type="string"),
     *             @OA\Property(property="email", type="string"),
     *             @OA\Property(property="telefono", type="string"),
     *             @OA\Property(property="calificacion", type="number", format="float"),
     *             @OA\Property(property="rematadores", type="array", @OA\Items(type="integer"))
     *         )
     *     ),
     *     @OA\Response(response=200, description="Casa de remate actualizada"),
     *     @OA\Response(response=404, description="Casa de remate no encontrada")
     * )
     */
    public function update(Request $request, string $id)
    {
        $casaRemate = CasaRemate::find($id);

        if (!$casaRemate) {
            return response()->json(['message' => 'Casa de remate no encontrada'], 404);
        }

        $validator = Validator::make($request->all(), [
            'nombre'        => 'sometimes|string|max:255',
            'idFiscal'      => 'sometimes|string|max:20',
            'email'         => 'sometimes|email|max:255',
            'telefono'      => 'nullable|string|max:20',
            'calificacion'  => 'nullable|numeric|min:0|max:5',
            'rematadores'   => 'sometimes|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $casaRemate->update($request->except('rematadores'));

        if ($request->has('rematadores')) {
            $casaRemate->rematadores()->sync($request->rematadores);
        }

        return response()->json($casaRemate);
    }

    /**
     * @OA\Delete(
     *     path="/api/casa-remates/{id}",
     *     summary="Eliminar una casa de remate por ID",
     *     tags={"CasaRemates"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Casa de remate eliminada"),
     *     @OA\Response(response=404, description="Casa de remate no encontrada")
     * )
     */
    public function destroy(string $id)
    {
        $casaRemate = CasaRemate::find($id);

        if (!$casaRemate) {
            return response()->json(['message' => 'Casa de remate no encontrada'], 404);
        }

        $casaRemate->delete();

        return response()->json(['message' => 'Casa de remate eliminada']);
    }

    /**
     * @OA\Post(
     *     path="/api/casa-remates/{id}/asociar-rematadores",
     *     summary="Asociar rematadores a una casa de remate",
     *     tags={"CasaRemates"},
     *     @OA\Parameter(
     *         name="id",
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
     *     @OA\Response(response=404, description="Casa de remate no encontrada")
     * )
     */
    public function asociarRematadores(Request $request, string $id)
    {
        $casaRemate = CasaRemate::find($id);

        if (!$casaRemate) {
            return response()->json(['message' => 'Casa de remate no encontrada'], 404);
        }

        $validator = Validator::make($request->all(), [
            'rematadores' => 'required|array',
            'rematadores.*' => 'integer|exists:rematadores,id'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $casaRemate->rematadores()->sync($request->rematadores);

        return response()->json([
            'message' => 'Rematadores asociados exitosamente',
            'casa_remate' => $casaRemate->load('rematadores')
        ]);
    }
}