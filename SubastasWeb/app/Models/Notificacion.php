<?php

    namespace App\Models;

    use Illuminate\Database\Eloquent\Model;
    use App\Models\Cliente;

    class Notificacion extends Model{

        protected $table = 'notificaciones'; 

        protected $fillable = [ 
            'mensaje'
        ]; 

        protected $hidden = []; // Columnas ocultas en las respuestas JSON

        public function clientes() {
            return $this->belongsToMany(Cliente::class, 'notificacion_clientes', 'notificacion_id', 'cliente_id');
        }

    }

?>