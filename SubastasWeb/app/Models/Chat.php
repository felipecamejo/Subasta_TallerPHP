<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Chat extends Model
{
    protected $table = 'chats';
    
    protected $fillable = [
        'chat_id',
        'usuario1_id',
        'usuario2_id',
        'ultimo_mensaje_at',
        'activo'
    ];
    
    protected $casts = [
        'ultimo_mensaje_at' => 'datetime',
        'activo' => 'boolean'
    ];
    
    // Relaciones
    public function usuario1()
    {
        return $this->belongsTo(Usuario::class, 'usuario1_id');
    }
    
    public function usuario2()
    {
        return $this->belongsTo(Usuario::class, 'usuario2_id');
    }
    
    public function mensajes()
    {
        return $this->hasMany(Mensaje::class);
    }
    
    public function ultimoMensaje()
    {
        return $this->hasOne(Mensaje::class)->latest('enviado_at');
    }
    
    // Método para obtener el otro usuario en el chat
    public function getOtroUsuario($usuarioId)
    {
        if ($this->usuario1_id == $usuarioId) {
            return $this->usuario2;
        } elseif ($this->usuario2_id == $usuarioId) {
            return $this->usuario1;
        }
        return null;
    }
    
    // Método para verificar si un usuario pertenece al chat
    public function perteneceAlChat($usuarioId)
    {
        return $this->usuario1_id == $usuarioId || $this->usuario2_id == $usuarioId;
    }
    
    // Scope para buscar chat por usuarios
    public function scopePorUsuarios($query, $usuario1Id, $usuario2Id)
    {
        return $query->where(function($q) use ($usuario1Id, $usuario2Id) {
            $q->where('usuario1_id', $usuario1Id)->where('usuario2_id', $usuario2Id)
              ->orWhere('usuario1_id', $usuario2Id)->where('usuario2_id', $usuario1Id);
        });
    }
}
