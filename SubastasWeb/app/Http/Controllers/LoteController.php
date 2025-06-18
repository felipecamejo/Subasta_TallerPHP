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
            $lote = Lote::with(['pujas', 'articulos.categoria', 'subasta'])->get();

            $dtos = $lote->map(function ($lote) {
                return $lote;
            });

            return response()->json($dtos);
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
     *             required={"valorBase", "pujaMinima"},
     *             @OA\Property(property="valorBase", type="float"),
     *             @OA\Property(property="pujaMinima", type="float"),
     *             @OA\Property(property="subasta_id", type="integer"),
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
            'valorBase' => 'required|numeric',
            'pujaMinima' => 'required|numeric',
            'subasta_id' => 'nullable|exists:subastas,id',
            'umbral' => 'nullable|numeric|min:0', 
        ]);
        
        $lote = Lote::create([
            'valorBase' => $request->valorBase,
            'pujaMinima' => $request->pujaMinima,
            'subasta_id' => $request->subasta_id,
            'umbral' => $request->umbral ?? 0, 
        ]);
        
        $lote = Lote::with(['pujas', 'articulos.categoria', 'subasta'])->find($lote->id);
        
        return response()->json($lote, 201);
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
