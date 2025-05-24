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
     * @OA\Post(
     *     path="/api/pujas",
     *     summary="Crear una nueva casa de remate",
     *     tags={"Pujas"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"fechaHora", "monto"},
     *             @OA\Property(property="fechaHora", type="time"),
     *             @OA\Property(property="monto", type="string"),
     *             @OA\Property(property="cliente", type="object",
     *                 @OA\Property(property="nombre", type="string"),
     *                 @OA\Property(property="cedula", type="string"),
     *                 @OA\Property(property="email", type="string"),
     *                 @OA\Property(property="telefono", type="string"),
     *                       @OA\Property(property="direccionFiscal", type="object",
     *                              @OA\Property(property="calle1", type="string"),
     *                              @OA\Property(property="calle2", type="string"),
     *                              @OA\Property(property="numero", type="string"),
     *                              @OA\Property(property="ciudad", type="string"),
     *                              @OA\Property(property="pais", type="string"),
     *                 @OA\Property(property="imagen", type="string"),
     *                 @OA\Property(property="contraseña", type="string"),
     *                 @OA\Property(property="monto", type="string"),
     *                
     * 
     *             )
     *         )
     *     ),
     *     @OA\Response(response=201, description="Casa de remate creada exitosamente"),
     *     @OA\Response(response=422, description="Error de validación")
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
