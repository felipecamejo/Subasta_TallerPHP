<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Articulo;

class ArticuloController extends Controller{
    /**
     * Display a listing of the resource.
     */
    public function index(){
        return response()->json(Articulo::all());
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request){

        $request->validate([
            'imagenes' => 'required|string', 
            'especificacion' => 'required|string', 
            'disponibilidad' => 'required|boolean', 
            'condicion' => 'required|string', 
            'vendedor_id' => 'required|exists:vendedores,id',
        ]);

        $articulo = Articulo::create([
            'imagenes' => $request->imagenes,
            'especificacion' => $request->especificacion,
            'disponibilidad' => $request->disponibilidad,
            'condicion' => $request->condicion,
            'vendedor_id' => $request->vendedor_id,
        ]);

        return response()->json($articulo, 201);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request){
        $request->validate([
            'imagenes' => 'required|string', 
            'especificacion' => 'required|string', 
            'disponibilidad' => 'required|boolean', 
            'condicion' => 'required|string', 
            'vendedor_id' => 'required|exists:vendedores,id',
        ]);

        $articulo = Articulo::create([
            'imagenes' => $request->imagenes,
            'especificacion' => $request->especificacion,
            'disponibilidad' => $request->disponibilidad,
            'condicion' => $request->condicion,
            'vendedor_id' => $request->vendedor_id,
        ]);

        return response()->json($articulo, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id){
        $articulo = Articulo::find($id);

        if (!$articulo) {
            return response()->json(['Error' => 'Articulo no encontrado. id:', $id], 404);
        }

        return response()->json($articulo);
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
       $articulo = Articulo::find($id);

        if (!$articulo) {
            return response()->json(['Error' => 'Articulo no encontrado. id:', $id], 404);
        }

        $request->validate([
            'imagenes' => 'required|string', 
            'especificacion' => 'required|string', 
            'disponibilidad' => 'required|boolean', 
            'condicion' => 'required|string', 
            'vendedor_id' => 'required|exists:vendedores,id',
        ]);

        $articulo->imagenes = $request->imagenes;
        $articulo->especificacion = $request->especificacion;
        $articulo->disponibilidad = $request->disponibilidad;
        $articulo->condicion = $request->condicion;
        $articulo->vendedor_id = $request->vendedor_id;
        
        $articulo->save();

        return response()->json($articulo);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id){
        $articulo = Articulo::find($id);

        if (!$articulo) {
            return response()->json(['Error' => "Articulo no encontrado. id: $id"], 404);
        }

        $articulo->delete();

        return response()->json(['Mensaje' => "Articulo eliminado correctamente. id: $id"], 200);
    }
}
