<?php

    namespace App\Models;

    use Illuminate\Database\Eloquent\Model;
    use App\Models\Cliente;
    use App\Models\Rematador;
    use App\Models\CasaRemate;
    use App\Models\Usuario;

    class Notificacion extends Model{

        protected $table = 'notificaciones'; 

        protected $fillable = [ 
            'titulo',
            'mensaje',
            'fecha_hora',
            'es_mensaje_chat',
            'chat_id'
        ]; 

        protected $casts = [
            'es_mensaje_chat' => 'boolean',
            'fecha_hora' => 'datetime'
        ];

        protected $hidden = []; // Columnas ocultas en las respuestas JSON


        public function usuarios() {
            return $this->belongsToMany(Usuario::class, 'notificacion_usuario', 'notificacion_id', 'usuario_id')
                ->withPivot('leido')
                ->withTimestamps();
        }
    }

?>