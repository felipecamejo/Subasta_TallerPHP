<?php
    namespace App\Models;
    use Illuminate\Database\Eloquent\Model;

    class DtoDireccion extends Model{


        protected $table = 'dto_direccion'; 

        protected $fillable = [ 
            'calle1', 
            'calle2', 
            'numero', 
            'ciudad', 
            'pais',
            'direccionable_id',
            'direccionable_type'
        ]; 

        protected $hidden = []; // Columnas ocultas en las respuestas JSON

        // funcion polimorfica
        public function direccionable()
        {
            return $this->morphTo();
        }

    }


?>