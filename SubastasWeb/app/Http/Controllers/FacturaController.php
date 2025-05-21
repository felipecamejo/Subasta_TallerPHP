<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Factura;
use OpenApi\Annotations as OA;


/**
 * @OA\Tag(
 *     name="Facturas",
 *     description="API para gestionar Facturas"
 * )
*/


class FacturaController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/facturas",
     *     summary="Obtener todas las facturas",
     *     tags={"Facturas"},
     *     @OA\Response(response=200, description="OK")
     * )
     */
    
   
    public function index()    {
 

        $facturas = Factura::with(['Vendedor', 'Puja'])->get();
        return response()->json($facturas);
    }

     /**
     * @OA\Post(
     *     path="/api/facturas",
     *     operationId="storeFactura",
     *     tags={"Facturas"},
     *     summary="Crear una nueva factura",
     *     description="Registra una factura con monto, condiciones de pago, fecha de entrega y referencia a un vendedor.",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"montoTotal","condicionesDePago","entrega","vendedor_id"},
     *             @OA\Property(
     *                 property="montoTotal",
     *                 type="number",
     *                 format="float",
     *                 example=1500.75,
     *                 description="Monto total de la venta"
     *             ),
     *             @OA\Property(
     *                 property="condicionesDePago",
     *                 type="string",
     *                 maxLength=255,
     *                 example="30 días neto",
     *                 description="Condiciones de pago acordadas"
     *             ),
     *             @OA\Property(
     *                 property="entrega",
     *                 type="string",
     *                 format="date",
     *                 example="2025-06-01",
     *                 description="Fecha de entrega pactada"
     *             ),
     *             @OA\Property(
     *                 property="vendedor_id",
     *                 type="integer",
     *                 example=42,
     *                 description="ID del vendedor existente"
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Venta creada correctamente",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(property="success", type="boolean", example=true),
     *            
     *         )
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Error de validación",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Los datos no son válidos"),
     *             @OA\Property(property="errors", type="object")
     *         )
     *     )
     * )
    */

    public function store(Request $request)    {
    

        $request->validate([
            'montoTotal' => 'required|numeric',
            'condicionesDePago' => 'required|string|max:255',
            'entrega' => 'required|date',
            'vendedor_id' => 'required|exists:vendedores,id',
        ]);

        $factura = Factura::create(attributes: $request->all());
        return response()->json($factura, 201);
    }

     /**
         * @OA\Get(
         *     path="/api/facturas/{id}",
         *     operationId="getFacturaById",
         *     tags={"Facturas"},
         *     summary="Obtener una factura por ID",
         *     description="Recupera una factura junto con su vendedor y pujas asociadas.",
         *     @OA\Parameter(
         *         name="id",
         *         in="path",
         *         description="ID de la factura",
         *         required=true,
         *         @OA\Schema(type="integer", example=1)
         *     ),
         *     @OA\Response(
         *         response=200,
         *         description="Factura encontrada",
         *         @OA\JsonContent(
         *             type="object",
         *             @OA\Property(property="id",             type="integer", example=1),
         *             @OA\Property(property="montoTotal",     type="number",  format="float", example=2500.00),
        *             @OA\Property(property="condicionesDePago", type="string", example="30 días neto"),
        *             @OA\Property(property="entrega",        type="string", format="date", example="2025-06-15"),
        *             @OA\Property(property="vendedor_id",    type="integer", example=5),
        *             @OA\Property(property="created_at",     type="string", format="date-time"),
        *             @OA\Property(property="updated_at",     type="string", format="date-time"),
        *             @OA\Property(
        *                 property="Vendedor",
        *                 type="object",
        *                 ref="#/components/schemas/Vendedor"
        *             ),
        *             @OA\Property(
        *                 property="Puja",
        *                 type="array",
        *                 @OA\Items(ref="#/components/schemas/Puja")
        *             )
        *         )
        *     ),
        *     @OA\Response(
        *         response=404,
        *         description="Factura no encontrada",
        *         @OA\JsonContent(
        *             @OA\Property(property="message", type="string", example="No query results for model [App\\Models\\Factura] 999")
        *         )
        *     )
        * )
        */

    public function show($id)    {
       
      
        $factura = Factura::with(['Vendedor', 'Puja'])->findOrFail($id);
        return response()->json($factura);
    }

       /**
         * @OA\Put(
         *     path="/api/facturas/{id}",
         *     operationId="updateFactura",
         *     tags={"Facturas"},
         *     summary="Actualizar una factura existente",
         *     description="Permite modificar uno o varios campos de una factura. Sólo los campos enviados se validan y actualizan.",
         *     @OA\Parameter(
         *         name="id",
         *         in="path",
         *         description="ID de la factura a actualizar",
         *         required=true,
         *         @OA\Schema(type="integer", example=1)
         *     ),
         *     @OA\RequestBody(
         *         required=true,
         *         @OA\JsonContent(
         *             @OA\Property(
         *                 property="montoTotal",
         *                 type="number",
         *                 format="float",
         *                 example=3000.50,
         *                 description="Nuevo monto total (si se envía)"
         *             ),
         *             @OA\Property(
         *                 property="condicionesDePago",
         *                 type="string",
         *                 maxLength=255,
         *                 example="Pago a 60 días",
         *                 description="Nuevas condiciones de pago (si se envía)"
         *             ),
         *             @OA\Property(
         *                 property="entrega",
         *                 type="string",
         *                 format="date",
         *                 example="2025-07-01",
         *                 description="Nueva fecha de entrega (si se envía)"
         *             ),
         *             @OA\Property(
         *                 property="vendedor_id",
         *                 type="integer",
         *                 example=10,
         *                 description="ID del vendedor (si se envía)"
         *             )
         *         )
         *     ),
         *     @OA\Response(
         *         response=200,
        *         description="Factura actualizada correctamente",
        *         @OA\JsonContent(ref="#/components/schemas/Factura")
        *     ),
        *     @OA\Response(
        *         response=404,
        *         description="Factura no encontrada",
        *         @OA\JsonContent(
        *             @OA\Property(property="message", type="string", example="No query results for model [App\\Models\\Factura] 999")
        *         )
        *     ),
        *     @OA\Response(
        *         response=422,
        *         description="Error de validación",
        *         @OA\JsonContent(
        *             @OA\Property(property="message", type="string", example="The given data was invalid."),
        *             @OA\Property(property="errors", type="object")
        *         )
        *     )
        * )
        */


    public function update(Request $request, $id)    {
      


        $factura = Factura::findOrFail($id);
        $request->validate([
            'montoTotal' => 'sometimes|required|numeric',
            'condicionesDePago' => 'sometimes|required|string|max:255',
            'entrega' => 'sometimes|required|date',
            'vendedor_id' => 'sometimes|required|exists:vendedors,id',
        ]);

        $factura->update($request->all());
        return response()->json($factura);
    }

     /**
        * @OA\Delete(
        *     path="/api/facturas/{id}",
        *     operationId="deleteFactura",
        *     tags={"Facturas"},
        *     summary="Eliminar una factura",
        *     description="Borra la factura especificada por su ID.",
        *     @OA\Parameter(
        *         name="id",
        *         in="path",
        *         description="ID de la factura a eliminar",
        *         required=true,
        *         @OA\Schema(type="integer", example=1)
        *     ),
        *     @OA\Response(
        *         response=204,
        *         description="Factura eliminada correctamente (sin contenido)"
        *     ),
        *     @OA\Response(
        *         response=404,
        *         description="Factura no encontrada",
        *         @OA\JsonContent(
        *             @OA\Property(property="message", type="string", example="No query results for model [App\\Models\\Factura] 999")
        *         )
        *     )
        * )
        */


    public function destroy($id)    {
       
        $factura = Factura::findOrFail($id);
        $factura->delete();
        return response()->json(null, 204);
    }
}


