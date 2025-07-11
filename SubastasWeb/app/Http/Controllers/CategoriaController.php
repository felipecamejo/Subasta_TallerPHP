<?php

namespace App\Http\Controllers;

use App\Models\Categoria;
use Illuminate\Http\Request;

/**
 * @OA\Tag(
 *     name="Categorias",
 *     description="API para gestionar categoria"
 * )
*/

class CategoriaController extends Controller{    

    /**
     * @OA\Get(
     *     path="/api/categorias",
     *     summary="Obtener todas las categoria",
     *     tags={"Categorias"},
     *     @OA\Response(response=200, description="OK")
     * )
    */
    public function index(){
        $categorias = Categoria::with(['categoriasHijas', 'articulos'])->get();

        $dtos = $categorias->map(function ($categoria) {
            return $categoria;
        });
        return response()->json($dtos);
    }

    /**
     * @OA\Post(
     *     path="/api/categorias",
     *     summary="Crear una nueva categoria",
     *     tags={"Categorias"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"nombre", "categoria_padre_id"},
     *             @OA\Property(property="nombre", type="string"),
     *             @OA\Property(property="categoria_padre_id", type="integer"),
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Categoria creada exitosamente"
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Error de validación"
     *     )
     * )
    */
    public function store(Request $request){
        $request->validate([
            'nombre' => 'required|string', 
            'categoria_padre_id' => 'nullable|exists:categorias,id',
        ]);

        $categoria = Categoria::create([
            'nombre' => $request->nombre,
            'categoria_padre_id' => $request->categoria_padre_id,
        ]);

        $categoria->load(['categoriasHijas', 'articulos']);

        return response()->json(
            $categoria, 
            201
        );
    }

    /**
     * @OA\Delete(
     *     path="/api/categorias/{id}",
     *     summary="Eliminar una categoria por ID",
     *     tags={"Categorias"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="ID de la categoria a eliminar",
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
        $categoria = Categoria::find($id);

        if (!$categoria) {
            return response()->json(['Error' => "Categoria no encontrado. id: $id"], 404);
        }

        $categoria->delete();

        return response()->json(['Mensaje' => "Categoria eliminado correctamente. id: $id"], 200);
    }
}
