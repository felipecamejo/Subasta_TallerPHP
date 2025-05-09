<?php
    namespace App\Models;
    use Illuminate\Database\Eloquent\Model;
    use App\Models\DtoDireccion;
    use App\Models\Usuario;
    use App\Models\Subasta;
    use App\Models\CasaRemate;

    class Rematador extends Usuario {
        protected $table = 'rematadores';

        protected $fillable = [ 
            'matricula', 
        ]; 

        protected $hidden = []; // Columnas ocultas en las respuestas JSON

        public function subastas() {
            return $this->hasMany(Subasta::class);
        }

        public function casasRemate() {
            return $this->BelongsToMany(CasaRemate::class,'casa_remate_rematador', 'rematador_id', 'casa_remate_id');
        }

}