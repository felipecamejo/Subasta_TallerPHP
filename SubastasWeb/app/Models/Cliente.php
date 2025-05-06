<?php
    namespace App\Models;
    use Illuminate\Database\Eloquent\Model;
    use App\Models\DtoDireccion;
    use App\Models\Usuario;
    use App\Models\Puja;

    class Cliente extends Usuario {
        protected $table = 'cliente';

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

}