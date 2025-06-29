<?php
    namespace App\Models;
    use App\Models\Rematador;
    use App\Models\Subasta;
    use App\Models\Valoracion;
    use Illuminate\Database\Eloquent\Model;

    class CasaRemate extends Model{


        protected $table = 'casa_remates'; 
        protected $primaryKey = 'usuario_id';
        protected $fillable = [ 
            'usuario_id',
            'idFiscal'
        ]; 

        protected $hidden = []; // Columnas ocultas en las respuestas JSON

        /**
         * Relación polimórfica con valoraciones
         */
       

        public function rematadores() {
            return $this->belongsToMany(Rematador::class, 'casa_remate_rematador', 'casa_remate_id', 'rematador_id');
        }

        public function subastas() {
            return $this->hasMany(Subasta::class, 'casa_remate_id', 'usuario_id');
        }

        public function usuario(){
            return $this->belongsTo(Usuario::class, 'usuario_id');
        }

        public function rematador(){
            return $this->hasOne(Rematador::class, 'usuario_id');
        }

        public function valoracion(){
            return $this->hasOne(Valoracion::class, 'valorable_id', 'usuario_id');
        }

    }
?>