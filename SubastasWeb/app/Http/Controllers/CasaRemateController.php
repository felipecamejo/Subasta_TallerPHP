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
        $casaRemate = CasaRemate::with(['rematadores', 'subastas', 'valoracion'])->get();
        return response()->json($casaRemate);
    }

    /**
     * @OA\Post(
     *     path="/api/casa-remates",
     *     summary="Crear una nueva casa de remate",
     *     tags={"CasaRemates"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"nombre", "idFiscal", "email", "telefono"},
     *             @OA\Property(property="nombre", type="string"),
     *             @OA\Property(property="idFiscal", type="string"),
     *             @OA\Property(property="email", type="string", format="email"),
     *             @OA\Property(property="telefono", type="string"),
     *             @OA\Property(property="latitud", type="number"),
     *             @OA\Property(property="longitud", type="number"),
     *         )
     *     ),
     *     @OA\Response(response=201, description="Casa de remate creada exitosamente"),
     *     @OA\Response(response=422, description="Error de validación")
     * )
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre'   => 'required|string|max:255',
            'idFiscal' => 'required|string|max:20',
            'email'    => 'required|email|max:255',
            'telefono' => 'nullable|string|max:20',
            'latitud'  => 'nullable|numeric',
            'longitud' => 'nullable|numeric',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $casaRemate = CasaRemate::create($request->only([
            'nombre',
            'idFiscal',
            'email',
            'telefono',
            'latitud',
            'longitud',
        ]));

        return response()->json($casaRemate, 201);
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
        $casaRemate = CasaRemate::with(['rematadores', 'subastas', 'valoracion'])->find($id);

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
     *             @OA\Property(property="email", type="string", format="email"),
     *             @OA\Property(property="telefono", type="string"),
     *             @OA\Property(property="latitud", type="number"),
     *             @OA\Property(property="longitud", type="number"),
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
            'nombre'   => 'sometimes|string|max:255',
            'idFiscal' => 'sometimes|string|max:20',
            'email'    => 'sometimes|email|max:255',
            'telefono' => 'nullable|string|max:20',
            'latitud'  => 'nullable|numeric',
            'longitud' => 'nullable|numeric',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $casaRemate->update($request->only([
            'nombre',
            'idFiscal',
            'email',
            'telefono',
            'latitud',
            'longitud',
        ]));

        return response()->json([
            'mensaje' => 'Casa de remate actualizada exitosamente.',
            'casaRemate' => $casaRemate
        ]);
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
     *     @OA\Response(response=404, description="Casa de remate no encontrada"),
     *     @OA\Response(response=422, description="Validación fallida")
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

    /**
     * @OA\Post(
     *     path="/api/casa-remates/{id}/calificar",
     *     summary="Agregar una calificación a una casa de remate",
     *     tags={"CasaRemates"},
     *     @OA\Parameter(
     *         name="id",
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
     *             @OA\Property(property="total", type="integer")
     *         )
     *     ),
     *     @OA\Response(response=404, description="Casa de remate no encontrada"),
     *     @OA\Response(response=422, description="Error de validación")
     * )
     */
    public function calificar(Request $request, $id)
    {
        $request->validate([
            'valor' => 'required|integer|min:1|max:5',
        ]);

        $casa = CasaRemate::findOrFail($id);
        $calificaciones = $casa->calificacion ?? [];
        $calificaciones[] = $request->valor;

        $casa->calificacion = $calificaciones;
        $casa->save();

        $promedio = round(array_sum($calificaciones) / count($calificaciones), 2);

        return response()->json([
            'mensaje' => 'Calificación agregada exitosamente.',
            'promedio' => $promedio,
            'total' => count($calificaciones),
        ]);
    }
}
