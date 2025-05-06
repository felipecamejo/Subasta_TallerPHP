<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\CasaRemate;
use App\Models\Rematador;
use App\Models\DtoDireccion;
use App\Models\Lote;

class Subasta extends Model
{
    protected $table = 'subastas'; 

    protected $fillable = [ 
        'duracionMinutos', 
        'fecha',
        'casaremate_id',
        'rematador_id'
    ]; 

    protected $hidden = [];

    public function casaRemate() {
        return $this->belongsTo(CasaRemate::class, 'casaremate_id');
    }

    public function rematador() {
        return $this->belongsTo(Rematador::class, 'rematador_id');
    }

    public function direccion() {
        return $this->morphOne(DtoDireccion::class, 'direccionable');
    }

    public function lotes() {
        return $this->hasMany(Lote::class);
    }
}
