<?php

    namespace App\Models;

    use Illuminate\Database\Eloquent\Model;

    class Articulo extends Model{

        protected $table = 'articulos'; // Nombre de la tabla si es diferente al plural de la clase
        protected $fillable = [ 'imagenes', 'especifiacacion', 'disponibilidad', 'condicion', 'vendedor', 'categorias']; // Columnas asignables en masa
        protected $hidden = []; // Columnas ocultas en las respuestas JSON
    }


?>