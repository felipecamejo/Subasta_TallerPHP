<?php
   namespace App\Models;

   use Illuminate\Database\Eloquent\Model;
   use App\Models\Vendedor;
   use App\Models\Puja;
  
   class Factura extends Model {

    protected $table = 'facturas'; // Nombre de la tabla si es diferente al plural de la clase

    protected $fillable = [ 
        'puja_id',
        'monto_total',
        'condiciones_de_pago',
        'entrega',
        'vendedor_id'
    ]; 

    protected $hidden = []; // Columnas ocultas en las respuestas JSON
        
    public function vendedor(){
        return  $this->belongsTo(Vendedor::class);
    } 

    public function puja(){
        return  $this->belongsTo(Puja::class);
    } 

    }