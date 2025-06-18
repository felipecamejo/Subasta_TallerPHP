<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Valoracion extends Model
{
    protected $table = 'valoraciones';

    protected $fillable = [
        'valoracion_total',
        'cantidad_opiniones',
        'valorable_type',
        'valorable_id'
    ];

    protected $casts = [
        'valoracion_total' => 'integer',
        'cantidad_opiniones' => 'integer'
    ];

    /**
     * Relación polimórfica - puede pertenecer a Cliente o CasaRemate
     */
    public function valorable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Calcular promedio de valoración
     */
    public function getPromedioAttribute(): float
    {
        if ($this->cantidad_opiniones === 0) {
            return 0.0;
        }
        
        return round($this->valoracion_total / $this->cantidad_opiniones, 1);
    }

    /**
     * Agregar nueva valoración
     */
    public function agregarValoracion(int $nuevaValoracion): void
    {
        $this->valoracion_total += $nuevaValoracion;
        $this->cantidad_opiniones += 1;
        $this->save();
    }

    /**
     * Obtener valoración en formato de estrellas (1-5)
     */
    public function getEstrellasAttribute(): int
    {
        return (int) round($this->promedio);
    }

    /**
     * Verificar si tiene valoraciones
     */
    public function tieneValoraciones(): bool
    {
        return $this->cantidad_opiniones > 0;
    }
}
