<?php

namespace App\Http\Controllers;

use App\Models\Vendedor;
use Illuminate\Http\Request;
use OpenApi\Annotations as OA;


/**
 * @OA\Tag(
 *     name="Vendedores",
 *     description="API para gestionar vendedores"
 * )
*/

class VendedorController extends Controller{

 /**
 * @OA\Get(
 *     path="/api/vendedores",
 *     summary="Obtener lista de vendedores",
 *     description="Retorna todos los vendedores con sus facturas, artículos y casas de remate.",
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
            return response()->json(Vendedor::all());
    }


     /**
     * @OA\Get(
     *     path="/api/vendedores/{id}",
     *     summary="Obtener un vendedor por ID",
     *     tags={"Vendedores"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="ID del vendedor",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Vendedor encontrado"
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Vendedor no encontrado"
     *     )
     * )
    */
   
    public function show(String $id) {
               $vendedor = Vendedor::find($id);

        if (!$vendedor) {
            return response()->json(['Error' => 'Vendedor no encontrado. id:', $id], 404);
        }

        return response()->json($vendedor);
    }
     
    

      /**
     * @OA\Post(
     *     path="/api/vendedores",
     *     summary="Crear un nuevo vendedor",
     *     tags={"Vendedores"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"nombre","vendedor_id"},
     *             @OA\Property(property="nombre", type="string"),
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Vendedor creado exitosamente"
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Error de validación"
     *     )
     * )
    */

   
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255'
        ]);

        $vendedor = Vendedor::create($validated);

        return response()->json($vendedor, 201);
    }

    /**
     * @OA\Put(
     *     path="/api/vendedores/{vendedor}",
     *     summary="Actualizar un vendedor",
     *     tags={"Vendedores"},
     *     @OA\Parameter(
     *         name="vendedor",
     *         in="path",
     *         description="ID del vendedor a actualizar",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"nombre"},
     *             @OA\Property(property="nombre", type="string")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Vendedor actualizado correctamente"),
     *     @OA\Response(response=404, description="Vendedor no encontrado")
     * )
    */

    public function update(Request $request, String $id)
    {
   
       $vendedor = Vendedor::find($id);

        if (!$vendedor) {
            return response()->json(['error' => 'Vendedor no encontrado'], 404);
        }

        $validated = $request->validate([
            'nombre' => 'sometimes|string|max:255'
        ]);

        // Actualizar usuario
        $vendedor->update([
            'nombre' => $validated['nombre'] ?? $vendedor->nombre
        ]);
        return response()->json($vendedor, 200);
    }

    /**
     * @OA\Delete(
     *     path="/api/vendedores/{id}",
     *     summary="Eliminar un vendedor por ID",
     *     tags={"Vendedores"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="ID del vendedor a eliminar",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Vendedor eliminado correctamente"
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Artículo no encontrado"
     *     )
     * )
     */
    public function destroy(String $id)
    {
         $vendedor = Vendedor::find($id);

        if (!$vendedor) {
            return response()->json(['Error' => "Vendedor no encontrado. id: $id"], 404);
        }

        $vendedor->delete();

        return response()->json(['Mensaje' => "Vendedor eliminado correctamente. id: $id"], 200);
    }
}
