<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Mensaje extends Model
{
    protected $table = 'mensajes';
    
    protected $fillable = [
        'chat_id',
        'usuario_id',
        'contenido',
        'enviado_at',
        'leido',
        'tipo'
    ];
    
    protected $casts = [
        'enviado_at' => 'datetime',
        'leido' => 'boolean'
    ];
    
    // Relaciones
    public function chat()
    {
        return $this->belongsTo(Chat::class);
    }
    
    public function usuario()
    {
        return $this->belongsTo(Usuario::class);
    }
    
    // Scopes
    public function scopeDelChat($query, $chatId)
    {
        return $query->where('chat_id', $chatId);
    }
    
    public function scopeNoLeidos($query)
    {
        return $query->where('leido', false);
    }
    
    public function scopeOrdenadosPorFecha($query)
    {
        return $query->orderBy('enviado_at', 'asc');
    }
    
    // Método para marcar como leído
    public function marcarComoLeido()
    {
        $this->update(['leido' => true]);
    }
}
