<?php

namespace App\Http\Controllers;

use App\Models\Lote;
use Illuminate\Http\Request;

class LoteController extends Controller{
    /**
     * Display a listing of the resource.
     */
    public function index(){
        return response()->json(Lote::all());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request){
        $request->validate([
            'valorBase' => 'required|numeric',
            'pujaMinima' => 'required|numeric',
        ]);

        $lote = Lote::create([
            'valorBase' => $request->valorBase,
            'pujaMinima' => $request->pujaMinima,
        ]);

        return response()->json($lote, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id){
        $lote = Lote::find($id);

        if (!$lote) {
            return response()->json(['Error' => 'Lote no encontrado. id:', $id], 404);
        }

        return response()->json($lote);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id){
       $lote = Lote::find($id);

        if (!$lote) {
            return response()->json(['Error' => 'Lote no encontrado. id:', $id], 404);
        }

        $request->validate([
            'valorBase' => 'required|numeric',
            'pujaMinima' => 'required|numeric',
        ]);

        $lote->valorBase = $request->valorBase;
        $lote->pujaMinima = $request->pujaMinima;
        
        $lote->save();

        return response()->json($lote);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id){
        $lote = Lote::find($id);

        if (!$lote) {
            return response()->json(['Error' => "Lote no encontrado. id: $id"], 404);
        }

        $lote->delete();

        return response()->json(['Mensaje' => "Lote eliminado correctamente. id: $id"], 200);
    }
}
