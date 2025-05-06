<?php
    namespace App\Models;
    use App\Models\DtoDireccion;
    use App\Models\Rematador;
    use App\Models\Subasta;
    use Illuminate\Database\Eloquent\Model;

    class CasaRemate extends Model{


        protected $table = 'casa_remates'; 

        protected $fillable = [ 
            'nombre', 
            'idFiscal', 
            'email', 
            'telefono', 
            'calificacion'
        ]; 

        protected $hidden = []; // Columnas ocultas en las respuestas JSON

        public function rematadores() {
            return $this->belongsToMany(Rematador::class, 'casa_remate_rematador', 'casa_remate_id', 'rematador_id');
        }

        public function subastas() {
            return $this->hasMany(Subasta::class);
        }

        public function direccion()
        {
            return $this->morphOne(DtoDireccion::class, 'direccionable');
        }

    }

?>