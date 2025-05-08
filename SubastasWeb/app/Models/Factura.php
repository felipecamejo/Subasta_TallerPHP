<?php
   namespace App\Models;

   use Illuminate\Database\Eloquent\Model;
   use App\Models\Vendedor;
   use App\Models\Puja;
  
   class Factura extends Model {

    protected $table = 'Facturas'; // Nombre de la tabla si es diferente al plural de la clase

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