<?php
    namespace App\Models;
    use Illuminate\Database\Eloquent\Model;
    use App\Models\DtoDireccion;
    use App\Models\Usuario;
    use App\Models\Puja;
    use App\Models\Notificacion;

    class Cliente extends Usuario {
        protected $table = 'clientes';

        protected $fillable = [ 
            'notificaciones', 
            'calificacion',
        ]; 

        protected $casts = [
            'notificaciones' => 'array',
        ];

        protected $hidden = []; // Columnas ocultas en las respuestas JSON

        public function pujas() {
            return $this->hasMany(Puja::class);
        }

        public function notificaciones() {
            return $this->belongsToMany(Notificacion::class, 'notificacion_clientes', 'cliente_id', 'notificacion_id');
        }

}