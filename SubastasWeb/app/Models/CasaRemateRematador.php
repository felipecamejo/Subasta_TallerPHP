<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CasaRemateRematador extends Model
{
    protected $table = 'casa_remate_rematador';

    protected $fillable = [
        'casa_remate_id',
        'rematador_id',
        'estado',
    ];

    public function casaRemate()
    {
        return $this->belongsTo(CasaRemate::class);
    }

    public function rematador()
    {
        return $this->belongsTo(Rematador::class, 'rematador_id', 'usuario_id');
    }
}
