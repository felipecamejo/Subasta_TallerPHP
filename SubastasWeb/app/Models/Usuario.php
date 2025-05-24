<?php
    namespace App\Models;
    use Illuminate\Database\Eloquent\Model;
    use App\DTOs\DtoDireccion;

    class Usuario extends Model{
        protected $table = 'usuarios';

        protected $fillable = [ 
            'nombre', 
            'cedula',
            'email',
            'telefono',
            'imagen'
        ]; 

        protected $hidden = [
            'contrasenia'
        ]; // Columnas ocultas en las respuestas JSON

        public function direccion() {
            return $this->morphOne(DtoDireccion::class, 'direccionable');
        }

}