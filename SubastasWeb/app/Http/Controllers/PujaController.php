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
 *     summary="Obtener lista de pujas",
 *     description="Retorna todas las pujas con sus facturas, artículos y casas de remate.",
 *     operationId="getVendedores",
 *     tags={"Vendedores"},
 *     
 *     @OA\Response(
 *         response=200,
 *         description="Lista de vendedores obtenida exitosamente",
 *         @OA\JsonContent(
 *              required={"nombre","vendedor_id"},
 *              @OA\Property(property="nombre", type="string"),
 *              @OA\Property(property="vendedor_id", type="integer")
 *         
 *           
 *         )
 *     ),
 *     
 *     @OA\Response(
 *         response=500,
 *         description="Error interno del servidor"
 *     )
 * )
 */
    public function index()
    {
        $pujas = Puja::with(['Clientes', 'Lote', 'Facturas'])->get();
        return response()->json($pujas);
    }

    // Crear una nueva puja
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

    // Mostrar una puja específica
    public function show($id)
    {
        $puja = Puja::with(['Clientes', 'Lote', 'Facturas'])->findOrFail($id);
        return response()->json($puja);
    }

    // Actualizar una puja
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

    // Eliminar una puja
    public function destroy($id)
    {
        $puja = Puja::findOrFail($id);
        $puja->delete();
        return response()->json(null, 204);
    }
    
}
