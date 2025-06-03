<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\CasaRemate;
use App\Models\Rematador;
use App\Models\Lote;

class Subasta extends Model
{
    protected $table = 'subastas'; 

    protected $fillable = [ 
        'nombre', 
        'fecha',
        'casa_remate_id',
        'rematador_id',
        'latitud',
        'longitud',
        'activa',
        'duracionMinutos'
    ]; 

    protected $hidden = [];

    public function casaRemate() {
        return $this->belongsTo(CasaRemate::class, 'casa_remate_id');
    }

    public function rematador() {
        return $this->belongsTo(Rematador::class, 'rematador_id', 'usuario_id')->withDefault();
    }
    public function lotes() {
        return $this->hasMany(Lote::class);
    }
}
