<?php
    namespace App\Models;

    use Illuminate\Database\Eloquent\Model;
    use App\Models\Articulo;
    use App\Models\Puja;
    
    class Lote extends Model{
        protected $table = 'lotes'; 

        protected $fillable = [ 
            'valorBase', 
            'pujaMinima',
            'subasta_id',
            'umbral',
            'pago'
        ]; 

        protected $hidden = []; // Columnas ocultas en las respuestas JSON

        public function pujas(){
            return $this->hasMany(Puja::class);
        }

        public function articulos() {
            return $this->hasMany(Articulo::class);
        }

        public function subasta(){
            return $this->belongsTo(Subasta::class);
        }

    

    }

?>