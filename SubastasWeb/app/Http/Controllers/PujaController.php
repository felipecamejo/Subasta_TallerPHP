<?php

namespace App\Http\Controllers;

use App\Models\Puja;
use Illuminate\Http\Request;

class PujaController extends Controller
{
   // Mostrar todas las pujas
    public function index()
    {
        $pujas = Puja::with(['Clientes', 'Lote', 'Facturas'])->get();
        return response()->json($pujas);
    }

    // Crear una nueva puja
    public function store(Request $request)
    {
        $request->validate([
            'fechaHora' => 'required|date',
            'monto' => 'required|numeric',
            'lote_id' => 'required|exists:lotes,id',
            'cliente_id' => 'required|exists:clientes,id',
            'facturas_id' => 'nullable|exists:facturas,id',
        ]);

        $puja = Puja::create($request->all());
        return response()->json($puja, 201);
    }

    // Mostrar una puja específica
    public function show($id)
    {
        $puja = Puja::with(['Clientes', 'Lote', 'Facturas'])->findOrFail($id);
        return response()->json($puja);
    }

    // Actualizar una puja
    public function update(Request $request, $id)
    {
        $puja = Puja::findOrFail($id);

        $request->validate([
            'fechaHora' => 'sometimes|required|date',
            'monto' => 'sometimes|required|numeric',
            'lote_id' => 'sometimes|required|exists:lotes,id',
            'cliente_id' => 'sometimes|required|exists:clientes,id',
            'facturas_id' => 'nullable|exists:facturas,id',
        ]);

        $puja->update($request->all());
        return response()->json($puja);
    }

    // Eliminar una puja
    public function destroy($id)
    {
        $puja = Puja::findOrFail($id);
        $puja->delete();
        return response()->json(null, 204);
    }
    
}
