<?php

namespace App\Http\Controllers;

use App\Models\Lote;
use Illuminate\Http\Request;
use App\Mappers\Mapper;

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
        $dtos = Lote::all()->map(function ($lote) {
            return Mapper::fromModelLote($lote);
        });
        return response()->json($dtos);
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

        return response()->json(Mapper::fromModelLote($lote), 201);
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
     *         description="Categoria no encontrado"
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
