<?php
 namespace App\Models;

 use Illuminate\Database\Eloquent\Model;
 use App\Models\Cliente;
 use App\Models\Lote;
 use App\Models\Factura;

 class Puja extends Model {
    protected $table = 'pujas'; // Nombre de la tabla si es diferente al plural de la clase

    protected $fillable = [ 
        'fechaHora',
        'monto',
        'lote_id',
        'factura_id',
        'cliente_id'
    ]; 

    protected $hidden = []; // Columnas ocultas en las respuestas JSON
    
    public function Cliente(){
        return $this->belongsTo(Cliente::class);
    }

    public function Lote(){
        return $this->belongsTo(Lote::class);
    }

    public function Factura(){
        return $this->belongsTo(Factura::class);
    }

}
?>