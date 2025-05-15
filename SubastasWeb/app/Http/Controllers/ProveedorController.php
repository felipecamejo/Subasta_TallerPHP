<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ProveedorController extends Controller
{
   /**
     * Muestra todos los rematadores.
     */
    public function index()
    {
        $rematadores = Rematador::with('direccion')->get();
        return response()->json($rematadores, 200);
    }

    /**
     * Mostrar formulario para crear (sin implementación).
     */
    public function create()
    {
        //
    }

    /**
     * Guarda un nuevo rematador en la base de datos.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'cedula' => 'required|string|unique:usuarios,cedula',
            'email' => 'required|email|unique:usuarios,email',
            'telefono' => 'nullable|string',
            'imagen' => 'nullable|string',
            'matricula' => 'required|string|unique:rematadores,matricula',
        ]);

        $rematador = Rematador::create($validated);

        return response()->json($rematador, 201);
    }

    /**
     * Muestra un rematador específico.
     */
    public function show(string $id)
    {
        $rematador = Rematador::with(['direccion', 'subastas', 'casasRemate'])->find($id); // el with es para cargar las relaciones
        // $rematador = Rematador::find($id); // sin relaciones

        if (!$rematador) {
            return response()->json(['error' => 'Rematador no encontrado'], 404);
        }

        return response()->json($rematador, 200);
    }

    /**
     * Mostrar formulario para editar (sin implementación).
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Actualiza un rematador existente.
     */
    public function update(Request $request, string $id)
    {
        $rematador = Rematador::find($id);

        if (!$rematador) {
            return response()->json(['error' => 'Rematador no encontrado'], 404);
        }

        $validated = $request->validate([
            'nombre' => 'sometimes|string|max:255',
            'cedula' => 'sometimes|string|unique:usuarios,cedula,' . $id,
            'email' => 'sometimes|email|unique:usuarios,email,' . $id,
            'telefono' => 'nullable|string',
            'imagen' => 'nullable|string',
            'matricula' => 'sometimes|string|unique:rematadores,matricula,' . $id,
        ]);

        $rematador->update($validated);

        return response()->json($rematador, 200);
    }

    /**
     * Elimina un rematador.
     */
    public function destroy(string $id)
    {
        $rematador = Rematador::find($id);

        if (!$rematador) {
            return response()->json(['error' => 'Rematador no encontrado'], 404);
        }

        $rematador->delete();

        return response()->json(['message' => 'Rematador eliminado con éxito'], 200);
    }
}
