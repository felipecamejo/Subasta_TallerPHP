<?php

namespace App\Models;

use App\Models\Rematador;
use App\Models\Subasta;
use Illuminate\Database\Eloquent\Model;

class CasaRemate extends Model
{
    protected $table = 'casa_remates';
    protected $primaryKey = 'usuario_id';

    protected $fillable = [
        'usuario_id',
        'idFiscal',
        'calificacion',
        'activo',
        'aprobado_por',
        'aprobado_en'
    ];

    protected $hidden = [];

    protected $casts = [
        'calificacion' => 'array',
        'aprobado_en' => 'datetime',
    ];

    public function rematadores()
    {
        return $this->belongsToMany(Rematador::class, 'casa_remate_rematador', 'casa_remate_id', 'rematador_id');
    }

    public function subastas()
    {
        return $this->hasMany(Subasta::class);
    }

    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    public function rematador()
    {
        return $this->hasOne(Rematador::class, 'usuario_id');
    }
}
