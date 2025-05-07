<?php
 namespace App\Models;

 use Illuminate\Database\Eloquent\Model;
 use App\Models\Cliente;
 use App\Models\Factura;

 class Puja extends Model {
    protected $table = 'pujas'; // Nombre de la tabla si es diferente al plural de la clase

    protected $fillable = [ 
        'fechaHora',
        'monto'
    ]; 

    protected $hidden = []; // Columnas ocultas en las respuestas JSON
    
    public function Cliente(){
        return $this->hasOne(Cliente::class);
       
    }

    public function Facturas(){
        return $this->hasOne(Factura::class);
    }

}
?>