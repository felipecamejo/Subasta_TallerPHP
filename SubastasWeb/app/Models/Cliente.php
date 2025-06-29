<?php
    namespace App\Models;
    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Database\Eloquent\Relations\MorphOne;
    use App\Models\DtoDireccion;
    use App\Models\Usuario;
    use App\Models\Puja;
    use App\Models\Notificacion;
    use App\Models\Valoracion;

    class Cliente extends Model {
        protected $table = 'clientes';
        protected $primaryKey = 'usuario_id';

        protected $fillable = [ 
            'usuario_id',
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

        public function valoracion()
        {
            return $this->hasOne(Valoracion::class, 'cliente_id', 'usuario_id');
        }

}