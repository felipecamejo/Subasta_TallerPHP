<?php

namespace App\Http\Controllers;

use App\Models\Factura;
use Illuminate\Http\Request;

class FacturaController extends Controller
{
    
    // Mostrar todas las facturas
    public function index()
    {
        $facturas = Factura::with(['Vendedor', 'Puja'])->get();
        return response()->json($facturas);
    }

    // Crear una nueva factura
    public function store(Request $request)
    {
        $request->validate([
            'montoTotal' => 'required|numeric',
            'condicionesDePago' => 'required|string|max:255',
            'entrega' => 'required|date',
            'vendedor_id' => 'required|exists:vendedors,id',
        ]);

        $factura = Factura::create($request->all());
        return response()->json($factura, 201);
    }

    // Mostrar una factura específica
    public function show($id)
    {
        $factura = Factura::with(['Vendedor', 'Puja'])->findOrFail($id);
        return response()->json($factura);
    }

    // Actualizar una factura
    public function update(Request $request, $id)
    {
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

    // Eliminar una factura
    public function destroy($id)
    {
        $factura = Factura::findOrFail($id);
        $factura->delete();
        return response()->json(null, 204);
    }
}
