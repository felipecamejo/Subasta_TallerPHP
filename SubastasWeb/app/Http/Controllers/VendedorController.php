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
 *             type="array",
 *             @OA\Items(ref="#/components/schemas/Vendedor")
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
     
        return response()->json(
            Vendedor::with(['Facturas', 'Articulos', 'CasaRemate'])->get()
        );
    }

    // GET /vendedores/{vendedor}
    public function show(Vendedor $vendedor)
    {
        // Devuelve un solo vendedor con sus relaciones
        return response()->json(
            $vendedor->load(['Facturas', 'Articulos', 'CasaRemate'])
        );
    }

    // POST /vendedores
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255'
        ]);

        $vendedor = Vendedor::create($validated);

        return response()->json($vendedor, 201);
    }

    // PUT /vendedores/{vendedor}
    public function update(Request $request, Vendedor $vendedor)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255'
        ]);

        $vendedor->update($validated);

        return response()->json($vendedor);
    }

    // DELETE /vendedores/{vendedor}
    public function destroy(Vendedor $vendedor)
    {
        $vendedor->delete();

        return response()->json(['mensaje' => 'Vendedor eliminado correctamente']);
    }
}
