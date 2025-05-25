<?php
    namespace App\Models;
    use Illuminate\Database\Eloquent\Model;
    use App\Models\DtoDireccion;
    use App\Models\Usuario;
    use App\Models\Puja;
    use App\Models\Notificacion;

    class Cliente extends Model {
        protected $table = 'clientes';

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
            return $this->belongsToMany(Puja::class, 'puja_cliente', 'cliente_id', 'puja_id');
        }

        public function notificaciones() {
            return $this->belongsToMany(Notificacion::class, 'notificacion_clientes', 'cliente_id', 'notificacion_id');
        }

}