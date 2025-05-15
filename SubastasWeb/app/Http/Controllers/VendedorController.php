<?php

namespace App\Http\Controllers;

use App\Models\Vendedor;
use Illuminate\Http\Request;

class VendedorController extends Controller
{

    // GET /vendedores
    public function index()
    {
        // Devuelve todos los vendedores con sus relaciones
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
