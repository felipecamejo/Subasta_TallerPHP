<?php
    namespace App\Models;
    use App\Models\CasaRemate;
    use App\Models\Usuario;
    use App\Models\Subasta;

    class DtoDireccion extends Model{


        protected $table = 'casa_remate'; 

        protected $fillable = [ 
            'calle1', 
            'calle2', 
            'numero', 
            'ciudad', 
            'pais'
        ]; 

        protected $hidden = []; // Columnas ocultas en las respuestas JSON

        public function casaRemate() {
            return $this->belongsTo(CasaRemate::class);
        }

        public function usuario() {
            return $this->belongsTo(Usuario::class);
        }

        public function subasta() {
            return $this->belongsTo(Subasta::class);
        }

    }


?>