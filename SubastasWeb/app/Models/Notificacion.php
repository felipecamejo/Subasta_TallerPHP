<?php

    namespace App\Models;

    use Illuminate\Database\Eloquent\Model;
    use App\Models\Cliente;
    use App\Models\Rematador;

    class Notificacion extends Model{

        protected $table = 'notificaciones'; 

        protected $fillable = [ 
            'titulo',
            'mensaje',
            'fecha_hora',
            'es_mensaje_chat'
        ]; 

        protected $casts = [
            'es_mensaje_chat' => 'boolean',
            'fecha_hora' => 'datetime'
        ];

        protected $hidden = []; // Columnas ocultas en las respuestas JSON

        public function clientes() {
            return $this->belongsToMany(Cliente::class, 'notificacion_clientes', 'notificacion_id', 'cliente_id')
                ->withPivot('leido')
                ->withTimestamps();
        }

        public function rematadores() {
            return $this->belongsToMany(Rematador::class, 'notificacion_rematadores', 'notificacion_id', 'rematador_id')
                ->withPivot('leido')
                ->withTimestamps();
        }
    }

?>