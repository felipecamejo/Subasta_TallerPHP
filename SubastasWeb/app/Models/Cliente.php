<?php
    namespace App\Models;
    use Illuminate\Database\Eloquent\Model;
    use App\Models\DtoDireccion;
    use App\Models\Usuario;
    use App\Models\Puja;
    use App\Models\Notificacion;

    class Cliente extends Model {
        protected $table = 'clientes';
        protected $primaryKey = 'usuario_id';

        protected $fillable = [ 
            'usuario_id',
            'calificacion',
        ];  

        protected $casts = [
            'notificaciones' => 'array',
        ];

        protected $hidden = []; // Columnas ocultas en las respuestas JSON

        public function usuario(){
            return $this->belongsTo(Usuario::class, 'usuario_id');
        }

        public function pujas() {
            return $this->hasMany(Puja::class, 'cliente_id', 'usuario_id');
        }

        public function notificaciones() {
            return $this->belongsToMany(Notificacion::class, 'notificacion_clientes', 'cliente_id', 'notificacion_id');
        }

}