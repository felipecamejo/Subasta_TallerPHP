<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Articulo;
use App\Mappers\Mapper;
use OpenApi\Annotations as OA;


/**
 * @OA\Tag(
 *     name="Articulos",
 *     description="API para gestionar artículos"
 * )
*/
class ArticuloController extends Controller{


    /**
     * @OA\Get(
     *     path="/api/articulos",
     *     summary="Obtener todos los articulos",
     *     tags={"Articulos"},
     *     @OA\Response(response=200, description="OK")
     * )
    */
    public function index(){
        $dtos = Articulo::all()->map(function ($articulo) {
            return Mapper::fromModelArticulo($articulo);
        });
        return response()->json($dtos);
    }

    /**
     * @OA\Post(
     *     path="/api/articulos",
     *     summary="Crear un nuevo artículo",
     *     tags={"Articulos"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"imagenes", "especificacion", "disponibilidad", "condicion", "vendedor_id"},
     *             @OA\Property(property="imagenes", type="string"),
     *             @OA\Property(property="especificacion", type="string"),
     *             @OA\Property(property="disponibilidad", type="boolean"),
     *             @OA\Property(property="condicion", type="string"),
     *             @OA\Property(property="vendedor_id", type="integer")
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Artículo creado exitosamente"
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Error de validación"
     *     )
     * )
    */
    public function store(Request $request){
        $request->validate([
            'imagenes' => 'required|string', 
            'especificacion' => 'required|string', 
            'disponibilidad' => 'required|boolean', 
            'condicion' => 'required|string', 
            'vendedor_id' => 'nullable|exists:vendedores,id',
        ]);

        $articulo = Articulo::create([
            'imagenes' => $request->imagenes,
            'especificacion' => $request->especificacion,
            'disponibilidad' => $request->disponibilidad,
            'condicion' => $request->condicion,
            'vendedor_id' => $request->vendedor_id,
        ]);

        return response()->json(Mapper::fromModelArticulo($articulo), 201);
    }

    /**
     * @OA\Get(
     *     path="/api/articulos/{id}",
     *     summary="Obtener un artículo por ID",
     *     tags={"Articulos"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="ID del artículo",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Artículo encontrado"
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Artículo no encontrado"
     *     )
     * )
    */
    public function show(string $id){
        $articulo = Articulo::find($id);

        if (!$articulo) {
            return response()->json(['Error' => 'Articulo no encontrado. id:', $id], 404);
        }

        return response()->json(Mapper::fromModelArticulo($articulo));
    }

    /**
     * @OA\Put(
     *     path="/api/articulos/{articulo}",
     *     summary="Actualizar un artículo",
     *     tags={"Articulos"},
     *     @OA\Parameter(
     *         name="articulo",
     *         in="path",
     *         description="ID del artículo a actualizar",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"imagenes", "especificacion", "disponibilidad", "condicion", "vendedor_id"},
     *             @OA\Property(property="imagenes", type="string"),
     *             @OA\Property(property="especificacion", type="string"),
     *             @OA\Property(property="disponibilidad", type="boolean"),
     *             @OA\Property(property="condicion", type="string"),
     *             @OA\Property(property="vendedor_id", type="integer")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Artículo actualizado correctamente"),
     *     @OA\Response(response=404, description="Artículo no encontrado")
     * )
    */
    public function update(Request $request, Articulo $articulo){

        $request->validate([
            'imagenes' => 'required|string', 
            'especificacion' => 'required|string', 
            'disponibilidad' => 'required|boolean', 
            'condicion' => 'required|string', 
            'vendedor_id' => 'nullable|exists:vendedores,id',
        ]);

        $articulo->imagenes = $request->imagenes;
        $articulo->especificacion = $request->especificacion;
        $articulo->disponibilidad = $request->disponibilidad;
        $articulo->condicion = $request->condicion;
        $articulo->vendedor_id = $request->vendedor_id;
        
        $articulo->save();

        return response()->json(mapper::fromModelArticulo($articulo), 200);
    }

    /**
     * @OA\Delete(
     *     path="/api/articulos/{id}",
     *     summary="Eliminar un artículo por ID",
     *     tags={"Articulos"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="ID del artículo a eliminar",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Artículo eliminado correctamente"
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Artículo no encontrado"
     *     )
     * )
     */
    public function destroy(string $id){
        $articulo = Articulo::find($id);

        if (!$articulo) {
            return response()->json(['Error' => "Articulo no encontrado. id: $id"], 404);
        }

        $articulo->delete();

        return response()->json(['Mensaje' => "Articulo eliminado correctamente. id: $id"], 200);
    }
}
