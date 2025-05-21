<?php
   namespace App\Models;

   use Illuminate\Database\Eloquent\Model;
   use App\Models\Vendedor;
   use App\Models\Puja;

   /**
 * @OA\Schema(
 *     schema="Factura",
 *     required={"montoTotal", "condicionesDePago", "entrega", "vendedor_id"},
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="montoTotal", type="number", format="float", example=2500.00),
 *     @OA\Property(property="condicionesDePago", type="string", example="30 días neto"),
 *     @OA\Property(property="entrega", type="string", format="date", example="2025-06-15"),
 *     @OA\Property(property="vendedor_id", type="integer", example=5),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time"),
 *     @OA\Property(
 *         property="Vendedor",
 *         ref="#/components/schemas/Vendedor"
 *     ),
 *     @OA\Property(
 *         property="Puja",
 *         type="array",
 *         @OA\Items(ref="#/components/schemas/Puja")
 *     )
 * )
 */
  
   class Factura extends Model {

    protected $table = 'facturas'; // Nombre de la tabla si es diferente al plural de la clase

    protected $fillable = [ 
        'montoTotal',
        'condicionesDePago',
        'entrega',
        'vendedor_id'
    ]; 

    protected $hidden = []; // Columnas ocultas en las respuestas JSON
        
    public function Vendedor(){
        return  $this->belongsTo(Vendedor::class);
    } 

    public function Puja(){
        return  $this->hasOne(Puja::class);
    } 

    }
?>