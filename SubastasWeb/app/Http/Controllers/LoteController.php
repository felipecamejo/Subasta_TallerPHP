<?php

namespace App\Http\Controllers;

use App\Models\Lote;
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
        return response()->json(Lote::all());
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
        ]);

        $lote = Lote::create([
            'valorBase' => $request->valorBase,
            'pujaMinima' => $request->pujaMinima,
        ]);

        return response()->json($lote, 201);
    }

    /**
     * @OA\Delete(
     *     path="/api/categorias/{id}",
     *     summary="Eliminar un categoria por ID",
     *     tags={"Categorias"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="ID del categoria a eliminar",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Categoria eliminada correctamente"
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Categoria no encontrada"
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
