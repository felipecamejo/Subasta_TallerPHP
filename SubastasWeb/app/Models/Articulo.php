<?php

    namespace App\Models;

    use Illuminate\Database\Eloquent\Model;
    use App\Models\Categoria;
    use App\Models\Vendedor;

    class Articulo extends Model{

        protected $table = 'articulos'; 

        protected $fillable = [ 
            'nombre',
            'estado',
            'imagenes', 
            'especificacion', 
            'disponibilidad', 
            'condicion', 
            'vendedor_id',
            'lote_id',
            'categoria_id'
        ]; 

        protected $hidden = []; // Columnas ocultas en las respuestas JSON

        public function categoria() {
            return $this->belongsTo(Categoria::class);
        }

        public function vendedor() {
            return $this->belongsTo(Vendedor::class);
        }

        public function lote() {
            return $this->belongsTo(Lote::class);
        }

    }

?>