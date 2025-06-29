<?php
    namespace App\Models;
    use App\Models\Rematador;
    use App\Models\Subasta;
    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Database\Eloquent\Relations\MorphOne;

    class CasaRemate extends Model{


        protected $table = 'casa_remates'; 
        protected $primaryKey = 'usuario_id';
        protected $fillable = [ 
            'usuario_id',
            'idFiscal'
        ]; 

        protected $hidden = []; // Columnas ocultas en las respuestas JSON

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

        public function notificaciones() {
            return $this->belongsToMany(Notificacion::class, 'notificaciones_casaremates', 'casa_remate_id', 'notificacion_id')
                ->withPivot('leido')
                ->withTimestamps();
        }

        public function valoracion(): MorphOne
        {
            return $this->morphOne(Valoracion::class, 'valorable');
        }

    }
?>