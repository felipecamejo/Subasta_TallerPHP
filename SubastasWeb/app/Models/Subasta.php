<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\CasaRemate;
use App\Models\Rematador;
use App\Models\Lote;
use App\DTOs\DtoDireccion;

class Subasta extends Model
{
    protected $table = 'subastas'; 

    protected $fillable = [ 
        'duracionMinutos', 
        'fecha',
        'casa_remate_id',
        'rematador_id',
        'latitud',
        'longitud',
    ]; 

    protected $hidden = [];

    public function casaRemate() {
        return $this->belongsTo(CasaRemate::class, 'casa_remate_id');
    }

    public function rematador() {
        return $this->belongsTo(Rematador::class, 'rematador_id');
    }
    public function lotes() {
        return $this->hasMany(Lote::class);
    }
}
