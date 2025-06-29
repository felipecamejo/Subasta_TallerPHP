<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Valoracion extends Model
{
    protected $table = 'valoraciones';

    protected $fillable = [
        'total_puntaje',
        'cantidad_opiniones',
        'valorable_id'
    ];

    protected $casts = [
        'total_puntaje' => 'integer',
        'cantidad_opiniones' => 'integer'
    ];

    /**
     * Relación directa con la entidad valorable (por ejemplo, CasaRemate)
     * Asumiendo que valorable_id se refiere a casa_remate_id
     */
    public function casaRemate(): BelongsTo
    {
        return $this->belongsTo(CasaRemate::class, 'valorable_id', 'usuario_id');
    }

    /**
     * Calcular promedio de valoración
     */
    public function getPromedioAttribute(): float
    {
        if ($this->cantidad_opiniones === 0) {
            return 0.0;
        }
        
        return round($this->total_puntaje / $this->cantidad_opiniones, 1);
    }

    /**
     * Agregar nueva valoración
     */
    public function agregarValoracion(int $nuevaValoracion): void
    {
        $this->total_puntaje += $nuevaValoracion;
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
