<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;
use Illuminate\Contracts\Auth\MustVerifyEmail;

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
    ]; 

    protected $hidden = [
        'contrasenia'
    ];

    public function cliente()
    {
        return $this->hasOne(Cliente::class, 'usuario_id');
    }

    public function rematador()
    {
        return $this->hasOne(Rematador::class, 'usuario_id');
    }

    public function getAuthPassword()
    {
        return $this->contrasenia;
    }
}