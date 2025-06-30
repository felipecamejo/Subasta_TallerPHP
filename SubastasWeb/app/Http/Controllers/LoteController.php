<?php

namespace App\Http\Controllers;

use App\Models\Lote;
use App\Models\Subasta;
use Illuminate\Http\Request;


/**
 * @OA\Tag(
 *     name="Lotes",
 *     description="API para gestionar lotes"
 * )
*/

class LoteController extends Controller{
    

    /**
     * @OA\Get(
     *     path="/api/lotes",
     *     summary="Obtener todos los lotes",
     *     tags={"Lotes"},
     *     @OA\Response(response=200, description="OK")
     * )
    */
    public function index(){
        try {
            $lotes = Lote::with([
                'pujas.cliente.usuario', 
                'articulos.categoria', 
                'articulos.vendedor',
                'subasta.casaRemate.usuario',
                'subasta.rematador.usuario'
            ])->get();

            return response()->json($lotes);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    /**
     * @OA\Post(
     *     path="/api/lotes",
     *     summary="Crear un nuevo lote",
     *     tags={"Lotes"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"valorBase", "pujaMinima", "subasta_id", "umbral"},
     *             @OA\Property(property="valorBase", type="float", description="Valor base del lote", example=100.00),
     *             @OA\Property(property="pujaMinima", type="float", description="Incremento mínimo para pujas", example=10.00),
     *             @OA\Property(property="subasta_id", type="integer", description="ID de la subasta", example=1),
     *             @OA\Property(property="umbral", type="float", description="Monto mínimo para validar el lote", example=50.00),
     *             @OA\Property(property="pago", type="boolean", description="Estado del pago", example=false)
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Lote creado exitosamente"
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Error de validación"
     *     )
     * )
    */
    public function store(Request $request){
        $request->validate([
            'valorBase' => 'required|numeric|min:0.01',
            'pujaMinima' => 'required|numeric|min:0.01',
            'subasta_id' => 'required|exists:subastas,id',
            'umbral' => 'required|numeric|min:0',
            'pago' => 'boolean'
        ]);
        
        $lote = Lote::create([
            'valorBase' => $request->valorBase,
            'pujaMinima' => $request->pujaMinima,
            'subasta_id' => $request->subasta_id,
            'umbral' => $request->umbral,
            'pago' => $request->pago ?? false
        ]);
        
        $lote = Lote::with(['pujas.cliente.usuario', 'articulos.categoria', 'subasta.casaRemate.usuario'])->find($lote->id);
        
        return response()->json($lote, 201);
    }

    /**
     * @OA\Get(
     *     path="/api/lotes/{id}",
     *     summary="Obtener un lote por ID",
     *     tags={"Lotes"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="ID del lote",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Lote encontrado"
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Lote no encontrado"
     *     )
     * )
     */
    public function show(string $id){
        try {
            $lote = Lote::with([
                'pujas.cliente.usuario', 
                'articulos.categoria', 
                'articulos.vendedor',
                'subasta.casaRemate.usuario',
                'subasta.rematador.usuario'
            ])->find($id);

            if (!$lote) {
                return response()->json(['error' => "Lote no encontrado. ID: $id"], 404);
            }

            return response()->json($lote);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    /**
     * @OA\Put(
     *     path="/api/lotes/{id}",
     *     summary="Actualizar un lote",
     *     tags={"Lotes"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="ID del lote",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="valorBase", type="float"),
     *             @OA\Property(property="pujaMinima", type="float"),
     *             @OA\Property(property="subasta_id", type="integer"),
     *             @OA\Property(property="umbral", type="float"),
     *             @OA\Property(property="pago", type="boolean")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Lote actualizado exitosamente"
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Lote no encontrado"
     *     )
     * )
     */
    public function update(Request $request, string $id){
        try {
            $lote = Lote::find($id);

            if (!$lote) {
                return response()->json(['error' => "Lote no encontrado. ID: $id"], 404);
            }

            $request->validate([
                'valorBase' => 'sometimes|numeric|min:0.01',
                'pujaMinima' => 'sometimes|numeric|min:0.01',
                'subasta_id' => 'sometimes|exists:subastas,id',
                'umbral' => 'sometimes|numeric|min:0',
                'pago' => 'sometimes|boolean'
            ]);

            $lote->update($request->only([
                'valorBase', 
                'pujaMinima', 
                'subasta_id', 
                'umbral', 
                'pago'
            ]));

            $lote = Lote::with([
                'pujas.cliente.usuario', 
                'articulos.categoria', 
                'articulos.vendedor',
                'subasta.casaRemate.usuario',
                'subasta.rematador.usuario'
            ])->find($lote->id);

            return response()->json($lote);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    /**
     * @OA\Delete(
     *     path="/api/lotes/{id}",
     *     summary="Eliminar un lote por ID",
     *     tags={"Lotes"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="ID del lote a eliminar",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Lote eliminado correctamente"
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Lote no encontrado"
     *     )
     * )
     */
    public function destroy(string $id){
        $lote = Lote::find($id);

        if (!$lote) {
            return response()->json(['Error' => "Lote no encontrado. id: $id"], 404);
        }

        $lote->delete();

        return response()->json(['Mensaje' => "Lote eliminado correctamente. id: $id"], 200);
    }

}
