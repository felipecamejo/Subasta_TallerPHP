<?php
    namespace App\Models;
    use Illuminate\Foundation\Auth\User as Authenticatable;
    use App\Models\DtoDireccion;
    use Laravel\Sanctum\HasApiTokens;
    use Illuminate\Notifications\Notifiable;

    class Usuario extends Authenticatable {
        // La clase Usuario hereda de Authenticatable para manejar la autenticación
        // y el uso de tokens de acceso personal.
        // Authenticatable extiende de Model, por lo que no es necesario volver a extender de Model.
        protected $table = 'usuarios';
        use HasApiTokens, Notifiable;

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