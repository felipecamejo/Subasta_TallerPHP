<?php
 namespace App\Models;

 use Illuminate\Database\Eloquent\Model;
 use App\Models\Cliente;
 use App\Models\Lote;
 use App\Models\Factura;
 use OpenApi\Annotations as OA;



/**
 * @OA\Schema(
 *     schema="Puja",
 *     required={"fechaHora", "monto", "lote_id", "cliente_id", "facturas_id"},
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="fechaHora", type="string", format="date-time", example="2025-06-01T14:30:00Z"),
 *     @OA\Property(property="monto", type="number", format="float", example=500.00),
 *     @OA\Property(property="lote_id", type="integer", example=3),
 *     @OA\Property(property="cliente_id", type="integer", example=7),
 *     @OA\Property(property="facturas_id", type="integer", example=10),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 */

 class Puja extends Model {
    protected $table = 'pujas'; 

    protected $fillable = [ 
        'fechaHora',
        'monto',
        'lote_id',
        'cliente_id',
        'facturas_id'
    ]; 

    protected $hidden = []; 
    
    public function Clientes(){
        return $this->belongsTo(Cliente::class);
    }

    public function Lote(){
        return $this->belongsTo(Lote::class);
    }

    public function Facturas(){
        return $this->belongsTo(Factura::class);
    }
}