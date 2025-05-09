<?php

    namespace App\Models;

    use Illuminate\Database\Eloquent\Model;
    use App\Models\Categoria;
    use App\Models\Vendedor;

    class Articulo extends Model{

        protected $table = 'articulos'; 

        protected $fillable = [ 
            'imagenes', 
            'especificacion', 
            'disponibilidad', 
            'condicion', 
            'vendedor_id'
        ]; 

        protected $hidden = []; // Columnas ocultas en las respuestas JSON

        public function categorias() {
            return $this->belongsToMany(Categoria::class, 'articulo_categoria', 'articulo_id', 'categoria_id');
        }

        public function vendedor() {
            return $this->belongsTo(Vendedor::class);
        }

    }

?>