<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Usuario extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'usuarios';

    protected $fillable = [ 
        'nombre', 
        'cedula',
        'email',
        'telefono',
        'imagen',
        'contrasenia',
        'latitud',
        'longitud',
        'google_id',
        'email_verified_at'
    ]; 

    protected $hidden = [
        'contrasenia',
        'remember_token',
    ];

    public function getAuthPassword()
    {
        return $this->contrasenia;
    }

    public function cliente()
    {
        return $this->hasOne(Cliente::class, 'usuario_id');
    }

    public function rematador()
    {
        return $this->hasOne(Rematador::class, 'usuario_id');
    }

    public function casaRemate()
    {
        return $this->hasOne(CasaRemate::class, 'usuario_id');
    }

    public function admin()
    {
        return $this->hasOne(Admin::class, 'usuario_id');
    }

    public function getRolAttribute()
    {
        if ($this->admin()->exists()) return 'admin';
        if ($this->rematador()->exists()) return 'rematador';
        if ($this->cliente()->exists()) return 'cliente';
        if ($this->casaRemate()->exists()) return 'casa_remate';
        return 'desconocido';
    }

    public function notificaciones() {
        return $this->belongsToMany(Notificacion::class, 'notificacion_usuario', 'usuario_id', 'notificacion_id')
            ->withPivot('leido')
            ->withTimestamps();
    }
}
