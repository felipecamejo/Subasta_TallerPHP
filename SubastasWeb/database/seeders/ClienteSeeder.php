<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\Usuario;
use App\Models\Cliente;

class ClienteSeeder extends Seeder
{
    public function run(): void
    {
        $clienteUsuario = Usuario::create([
            'nombre' => 'Steven Spielberg',
            'cedula' => '11111111',
            'email' => 'spielberg@example.com',
            'telefono' => '099111111',
            'imagen' => null,
            'contrasenia' => Hash::make('123456789'),
            'latitud' => -34.9011,
            'longitud' => -56.1645,
            'email_verified_at' => now(),
        ]);

        Cliente::create([
            'usuario_id' => $clienteUsuario->id,
            'calificacion' => 5,
        ]);
    }
}
