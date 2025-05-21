<?php

    namespace App\Models;

    use Illuminate\Database\Eloquent\Model;
    use App\Models\Factura;
    use App\Models\Articulo;
    use App\Models\CasaRemate;
    use OpenApi\Annotations as OA;

    /**
 * @OA\Schema(
 *     schema="Vendedor",
 *     type="object",
 *     title="Vendedor",
 *     required={"id", "nombre"},
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="nombre", type="string", example="Juan Pérez"),
 *     @OA\Property(property="email", type="string", example="juan@example.com")
 * )
 */


    class Vendedor extends Model{

        protected $table = 'vendedores'; // Nombre de la tabla si es diferente al plural de la clase

        protected $fillable = [ 
            'nombre'     
        ]; 

        protected $hidden = []; // Columnas ocultas en las respuestas JSON
       
        public function Facturas(){
            return $this->hasMany(Factura::class);
        }
        
        public function Articulos(){
            return $this->hasMany(Articulo::class);
        }

        public function CasaRemate() {
            return $this->hasMany(CasaRemate::class);
        }

    }
?>