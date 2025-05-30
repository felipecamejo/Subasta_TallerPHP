<?php

    namespace App\Models;

    use Illuminate\Database\Eloquent\Model;
    use App\Models\Factura;
    use App\Models\Articulo;
    use App\Models\CasaRemate;

    class Vendedor extends Model{

        protected $table = 'vendedores'; // Nombre de la tabla si es diferente al plural de la clase

        protected $fillable = [ 
            'nombre'     
        ]; 

        protected $hidden = []; // Columnas ocultas en las respuestas JSON
       
        public function facturas(){
            return $this->hasMany(Factura::class);
        }
        
        public function articulos(){
            return $this->hasMany(Articulo::class);
        }

        public function casaRemate() {
            return $this->hasMany(CasaRemate::class);
        }

    }
?>