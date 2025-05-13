<?php

namespace App\Http\Controllers;

use App\Models\Lote;
use Illuminate\Http\Request;

class LoteController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(){
        return response()->json(Lote::all());
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request){

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
     * Show the form for editing the specified resource.
     */
    public function edit(string $id){
        
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id){
       
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id){
        
    }
}
