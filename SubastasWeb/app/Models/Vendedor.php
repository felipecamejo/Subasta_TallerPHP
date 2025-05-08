<?php

    namespace App\Models;

    use Illuminate\Database\Eloquent\Model;
    use App\Models\Factura;
    use App\Models\Articulo;
    

    class Vendedor extends Model{

        protected $table = 'vendedores'; // Nombre de la tabla si es diferente al plural de la clase

        protected $fillable = [ 
            'nombre',
            'factura',
            'articulo',
            
        ]; 

        protected $hidden = []; // Columnas ocultas en las respuestas JSON
       
        public function Facturas(){
            return $this->hasMany(Factura::class);
        }
        
        public function Articulos(){
            return $this->hasMany(Articulo::class);
        }

    }
?>