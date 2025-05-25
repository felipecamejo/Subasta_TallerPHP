<?php

namespace App\Http\Controllers;

use App\Models\Puja;
use Illuminate\Http\Request;
use OpenApi\Annotations as OA;

/**
 * @OA\Tag(
 *     name="Pujas",
 *     description="API para gestionar Pujas"
 * )
*/

class PujaController extends Controller
{
 /**
 * @OA\Get(
 *     path="/api/pujas",
 *     summary="Listar todas las pujas",
 *     tags={"Pujas"},
 *     @OA\Response(
 *         response=200,
 *         description="Lista de pujas",
 *         @OA\JsonContent(
 *             type="array",
 *             @OA\Items(
 *                 type="object",
 *                 @OA\Property(
 *                     property="fechaHora",
 *                     type="string",
 *                     format="date-time",
 *                     example="2025-05-25T15:30:00Z"
 *                 ),
 *                 @OA\Property(
 *                     property="monto",
 *                     type="number",
 *                     format="float",
 *                     example=1500.75
 *                 ),
 *                 @OA\Property(
 *                     property="factura",
 *                     type="object",
 *                     nullable=true,
 *                     @OA\Property(property="id", type="integer", example=10),
 *                     
 *                 ),
 *                 @OA\Property(
 *                     property="usuario",
 *                     type="object",
 *                     @OA\Property(property="id", type="integer", example=3),
 *                     @OA\Property(property="nombre", type="string", example="Ana Gómez")
 *                 ),
 *                 @OA\Property(
 *                     property="lote",
 *                     type="object",
 *                     @OA\Property(property="id", type="integer", example=7),
 *                     @OA\Property(property="descripcion", type="string", example="Lote de maderas nativas")
 *                 )
 *             )
 *         )
 *     )
 * )
 */
 
    public function index()
    {
            return response()->json(Puja::all());
    }
    /**
 * @OA\Post(
 *     path="/api/pujas",
 *     summary="Crear una nueva puja",
 *     tags={"Pujas"},
 *     @OA\RequestBody(
 *         required=true,
 *         description="Datos para crear una nueva puja",
 *         @OA\JsonContent(
 *             type="object",
 *             required={"fechaHora", "monto", "lote_id", "cliente_id"},
 *             @OA\Property(
 *                 property="fechaHora",
 *                 type="string",
 *                 format="date-time",
 *                 example="2025-05-25T15:30:00Z"
 *             ),
 *             @OA\Property(
 *                 property="monto",
 *                 type="number",
 *                 format="float",
 *                 example=1500.75
 *             ),
 *             @OA\Property(
 *                 property="lote_id",
 *                 type="integer",
 *                 example=2,
 *                 description="ID del lote relacionado"
 *             ),
 *             @OA\Property(
 *                 property="cliente_id",
 *                 type="integer",
 *                 example=5,
 *                 description="ID del cliente que realiza la puja"
 *             ),
 *             @OA\Property(
 *                 property="facturas_id",
 *                 type="integer",
 *                 nullable=true,
 *                 example=10,
 *                 description="ID de la factura (opcional)"
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=201,
 *         description="Puja creada exitosamente",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="id", type="integer", example=1),
 *             @OA\Property(property="fechaHora", type="string", format="date-time", example="2025-05-25T15:30:00Z"),
 *             @OA\Property(property="monto", type="number", format="float", example=1500.75),
 *             @OA\Property(property="lote_id", type="integer", example=2),
 *             @OA\Property(property="cliente_id", type="integer", example=5),
 *             @OA\Property(property="facturas_id", type="integer", nullable=true, example=10)
 *         )
 *     ),
 *     @OA\Response(
 *         response=422,
 *         description="Datos inválidos"
 *     )
 * )
 */

    
    public function store(Request $request)
    {
        $request->validate([
            'fechaHora' => 'required|date',
            'monto' => 'required|numeric',
            'lote_id' => 'required|exists:lotes,id',
            'cliente_id' => 'required|exists:clientes,id',
            'facturas_id' => 'nullable|exists:facturas,id',
        ]);

        $puja = Puja::create($request->all());
        return response()->json($puja, 201);
    }

    /**
 * @OA\Get(
 *     path="/api/pujas/{id}",
 *     summary="Obtener una puja por ID",
 *     tags={"Pujas"},
 *     @OA\Parameter(
 *         name="id",
 *         in="path",
 *         required=true,
 *         description="ID de la puja",
 *         @OA\Schema(type="integer", example=1)
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Puja encontrada",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="id", type="integer", example=1),
 *             @OA\Property(property="fechaHora", type="string", format="date-time", example="2025-05-25T15:30:00Z"),
 *             @OA\Property(property="monto", type="number", format="float", example=1500.75),
 *             @OA\Property(property="lote", type="object",
 *                 @OA\Property(property="id", type="integer", example=2),
 *                 @OA\Property(property="descripcion", type="string", example="Lote de madera dura")
 *             ),
 *             @OA\Property(property="usuario", type="object",
 *                 @OA\Property(property="id", type="integer", example=5),
 *                 @OA\Property(property="nombre", type="string", example="Ana Gómez")
 *             ),
 *             @OA\Property(property="factura", type="object", nullable=true,
 *                 @OA\Property(property="id", type="integer", example=10),
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=404,
 *         description="Puja no encontrada"
 *     )
 * )
 */
    public function show($id)
    {
        $puja = Puja::find($id);

        if (!$puja) {
            return response()->json(['Error' => 'Puja no encontrada. id:', $id], 404);
        }

        return response()->json($puja , 200);
    }

   /**
 * @OA\Put(
 *     path="/api/pujas/{id}",
 *     summary="Actualizar una puja existente",
 *     tags={"Pujas"},
 *     @OA\Parameter(
 *         name="id",
 *         in="path",
 *         required=true,
 *         description="ID de la puja a actualizar",
 *         @OA\Schema(type="integer", example=1)
 *     ),
 *     @OA\RequestBody(
 *         required=true,
 *         description="Datos actualizados de la puja",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="fechaHora", type="string", format="date-time", example="2025-06-01T14:00:00Z"),
 *             @OA\Property(property="monto", type="number", format="float", example=1800.00),
 *             @OA\Property(property="lote_id", type="integer", example=2),
 *             @OA\Property(property="cliente_id", type="integer", example=5),
 *             @OA\Property(property="facturas_id", type="integer", nullable=true, example=10)
 *         )
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Puja actualizada correctamente",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="id", type="integer", example=1),
 *             @OA\Property(property="fechaHora", type="string", format="date-time", example="2025-06-01T14:00:00Z"),
 *             @OA\Property(property="monto", type="number", format="float", example=1800.00),
 *             @OA\Property(property="lote_id", type="integer", example=2),
 *             @OA\Property(property="cliente_id", type="integer", example=5),
 *             @OA\Property(property="facturas_id", type="integer", nullable=true, example=10)
 *         )
 *     ),
 *     @OA\Response(
 *         response=404,
 *         description="Puja no encontrada"
 *     ),
 *     @OA\Response(
 *         response=422,
 *         description="Datos inválidos"
 *     )
 * )
 */
    public function update(Request $request, $id)
    {
        $puja = Puja::findOrFail($id);

        $request->validate([
            'fechaHora' => 'sometimes|required|date',
            'monto' => 'sometimes|required|numeric',
            'lote_id' => 'sometimes|required|exists:lotes,id',
            'cliente_id' => 'sometimes|required|exists:clientes,id',
            'facturas_id' => 'nullable|exists:facturas,id',
        ]);

        $puja->update($request->all());
        return response()->json($puja);
    }

    /**
 * @OA\Delete(
 *     path="/api/pujas/{id}",
 *     summary="Eliminar una puja",
 *     tags={"Pujas"},
 *     @OA\Parameter(
 *         name="id",
 *         in="path",
 *         required=true,
 *         description="ID de la puja a eliminar",
 *         @OA\Schema(type="integer", example=1)
 *     ),
 *     @OA\Response(
 *         response=204,
 *         description="Puja eliminada correctamente (sin contenido)"
 *     ),
 *     @OA\Response(
 *         response=404,
 *         description="Puja no encontrada"
 *     )
 * )
 */
    public function destroy($id)
    {
         $puja = Puja::find($id);

        if (!$puja) {
            return response()->json(['Error' => "Puja no encontrada. id: $id"], 404);
        }

        $puja->delete();

        return response()->json(['Mensaje' => "Puja eliminado correctamente. id: $id"], 200);
    }
    
}
