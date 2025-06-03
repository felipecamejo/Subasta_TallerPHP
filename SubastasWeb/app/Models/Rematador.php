<?php
    namespace App\Models;
    use Illuminate\Database\Eloquent\Model;
    use App\Models\DtoDireccion;
    use App\Models\Usuario;
    use App\Models\Subasta;
    use App\Models\CasaRemate;

    class Rematador extends Model {
        protected $table = 'rematadores';
        protected $primaryKey = 'usuario_id';

        protected $fillable = [ 
        'usuario_id',
        'matricula'
        ]; 

        protected $hidden = []; // Columnas ocultas en las respuestas JSON

        public function usuario(){
            return $this->belongsTo(Usuario::class, 'usuario_id');
        }

        public function subastas() {
            return $this->hasMany(Subasta::class, 'rematador_id', 'usuario_id');
        }

        public function casasRemate() {
            return $this->BelongsToMany(CasaRemate::class,'casa_remate_rematador', 'rematador_id', 'casa_remate_id');
        }

}