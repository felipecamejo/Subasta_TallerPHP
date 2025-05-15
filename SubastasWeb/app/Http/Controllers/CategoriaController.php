<?php

namespace App\Http\Controllers;

use App\Models\Categoria;
use Illuminate\Http\Request;

class CategoriaController extends Controller{
    /**
     * Display a listing of the resource.
     */
    public function index(){
        return response()->json(Categoria::all());
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request){

        $request->validate([
            'nombre' => 'required|string', 
            'categoria_padre_id' => 'required|exists:categorias,id',
        ]);

        $categoria = Categoria::create([
            'nombre' => $request->nombre,
            'categoria_padre_id' => $request->categoria_padre_id,
        ]);

        return response()->json($categoria, 201);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request){
        $request->validate([
            'nombre' => 'required|string', 
            'categoria_padre_id' => 'required|exists:categorias,id',
        ]);

        $categoria = Categoria::create([
            'nombre' => $request->nombre,
            'categoria_padre_id' => $request->categoria_padre_id,
    
        ]);

        return response()->json($categoria, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id){
        $categoria = Categoria::find($id);

        if (!$categoria) {
            return response()->json(['Error' => 'Categoria no encontrado. id:', $id], 404);
        }

        return response()->json($categoria);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id){
        return response()->json(['message' => 'Método no implementado'], 501);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id){
       $categoria = Categoria::find($id);

        if (!$categoria) {
            return response()->json(['Error' => 'Categoria no encontrado. id:', $id], 404);
        }

        $request->validate([
            'nombre' => 'required|string', 
            'categoria_padre_id' => 'required|exists:categorias,id',
        ]);

        $categoria->nombre = $request->nombre;
        $categoria->categoria_padre_id = $request->categoria_padre_id;

        $categoria->save();

        return response()->json($categoria);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id){
        $categoria = Categoria::find($id);

        if (!$categoria) {
            return response()->json(['Error' => "Categoria no encontrado. id: $id"], 404);
        }

        $categoria->delete();

        return response()->json(['Mensaje' => "Categoria eliminado correctamente. id: $id"], 200);
    }
}
