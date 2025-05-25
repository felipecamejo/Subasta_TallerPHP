<?php

namespace App\Http\Controllers;

use App\Models\Subasta;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SubastaController extends Controller
{
    // Listar todas las subastas
    public function index()
    {
        return Subasta::with(['casaremate', 'rematador', 'direccion', 'lotes'])->get();
    }

    // Crear una nueva subasta con relaciones (incluye direccion y lotes)
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'duracionMinutos' => 'required|integer|min:1',
            'fecha'           => 'required|date',
            'casaremate_id'   => 'required|exists:casa_remates,id',
            'rematador_id'    => 'required|exists:rematadores,id',
            'direccion'       => 'sometimes|array',
            'lotes'           => 'sometimes|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Crear subasta
        $subasta = Subasta::create($request->only([
            'duracionMinutos',
            'fecha',
            'casaremate_id',
            'rematador_id'
        ]));

        // Crear dirección si viene
        if ($request->has('direccion')) {
            $subasta->direccion()->create($request->input('direccion'));
        }

        // Crear lotes si vienen
        if ($request->has('lotes')) {
            foreach ($request->input('lotes') as $loteData) {
                $subasta->lotes()->create($loteData);
            }
        }

        // Retornar subasta con relaciones cargadas
        $subasta->load(['casaremate', 'rematador', 'direccion', 'lotes']);

        return response()->json($subasta, 201);
    }

    // Mostrar una subasta específica
    public function show($id)
    {
        $subasta = Subasta::with(['casaremate', 'rematador', 'direccion', 'lotes'])->find($id);

        if (!$subasta) {
            return response()->json(['message' => 'Subasta no encontrada'], 404);
        }

        return response()->json($subasta);
    }

    // Actualizar subasta y relaciones
    public function update(Request $request, $id)
    {
        $subasta = Subasta::find($id);

        if (!$subasta) {
            return response()->json(['message' => 'Subasta no encontrada'], 404);
        }

        $validator = Validator::make($request->all(), [
            'duracionMinutos' => 'sometimes|integer|min:1',
            'fecha'           => 'sometimes|date',
            'casaremate_id'   => 'sometimes|exists:casa_remates,id',
            'rematador_id'    => 'sometimes|exists:rematadores,id',
            'direccion'       => 'sometimes|array',
            'lotes'           => 'sometimes|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $subasta->update($request->only([
            'duracionMinutos',
            'fecha',
            'casaremate_id',
            'rematador_id'
        ]));

        // Actualizar o crear dirección
        if ($request->has('direccion')) {
            if ($subasta->direccion) {
                $subasta->direccion()->update($request->input('direccion'));
            } else {
                $subasta->direccion()->create($request->input('direccion'));
            }
        }

        // Actualizar lotes (ejemplo sencillo: borrar todos y crear nuevos)
        if ($request->has('lotes')) {
            $subasta->lotes()->delete();
            foreach ($request->input('lotes') as $loteData) {
                $subasta->lotes()->create($loteData);
            }
        }

        $subasta->load(['casaremate', 'rematador', 'direccion', 'lotes']);

        return response()->json($subasta);
    }

    // Eliminar subasta y sus lotes y direccion asociados
    public function destroy($id)
    {
        $subasta = Subasta::find($id);

        if (!$subasta) {
            return response()->json(['message' => 'Subasta no encontrada'], 404);
        }

        // Opcionalmente eliminar la direccion asociada
        if ($subasta->direccion) {
            $subasta->direccion->delete();
        }

        // Eliminar lotes asociados
        $subasta->lotes()->delete();

        // Eliminar la subasta
        $subasta->delete();

        return response()->json(['message' => 'Subasta eliminada correctamente']);
    }
}