<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\CasaRemate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;



class CasaRemateController extends Controller
{
    public function index()
    {
        // el nombre viene de como se llaman las funciones en el modelo
        return CasaRemate::with(['rematadores', 'subastas', 'direccion'])->get();
    }

    // funcion para crear una nueva casa de remate
    public function store(Request $request)
    {
        // Validator es una clase de Laravel que permite validar los datos de entrada
        $validator = Validator::make($request->all(), [
            'nombre'      => 'required|string|max:255',
            'idFiscal'    => 'required|string|max:20',
            'email'       => 'required|email|max:255',
            'telefono'    => 'nullable|string|max:20',
            'calificacion'=> 'nullable|numeric|min:0|max:5',
            'rematadores'       => 'sometimes|array',
            'direccion'       => 'sometimes|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $casaRemate = CasaRemate::create($request->all());

        // despues de ser creada la casa de remate se hace la asociacion con las demas relaciones
        if ($request->has('rematadores')) {
            $casaRemate->rematadores()->sync($request->input('rematadores')); // espera un array con ids de rematadores
        }
        if ($request->has('direccion')) {
            $casaRemate->direccion()->create($request->input('direccion'));
        }

        // las subastas se crean una vez existe la casa de remate por ende es imposible crear una casa de remate y asociar una subasta

        return response()->json($casaRemate, 201);
    }

    public function show(string $id)
    {
        $casaRemate = CasaRemate::with(['rematadores', 'subastas', 'direccion'])->find($id);

        if (!$casaRemate) {
            return response()->json(['message' => 'Casa de remate no encontrada'], 404);
        }

        return response()->json($casaRemate);
    }

    public function update(Request $request, string $id)
    {
        $casaRemate = CasaRemate::find($id);

        if (!$casaRemate) {
            return response()->json(['message' => 'Casa de remate no encontrada'], 404);
        }

        $validator = Validator::make($request->all(), [
            'nombre'      => 'sometimes|string|max:255',
            'idFiscal'    => 'sometimes|string|max:20',
            'email'       => 'sometimes|email|max:255',
            'telefono'    => 'nullable|string|max:20',
            'calificacion'=> 'nullable|numeric|min:0|max:5',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $casaRemate->update($request->all());

        return response()->json($casaRemate);
    }

    public function destroy(string $id)
    {
        $casaRemate = CasaRemate::find($id);

        if (!$casaRemate) {
            return response()->json(['message' => 'Casa de remate no encontrada'], 404);
        }

        $casaRemate->delete();

        return response()->json(['message' => 'Casa de remate eliminada']);
    }
}
