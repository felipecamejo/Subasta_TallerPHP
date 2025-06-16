<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\Usuario;
use App\Models\Rematador;

class RematadorSeeder extends Seeder
{
    public function run(): void
    {
        $rematadorUsuario = Usuario::create([
            'nombre' => 'Rematador Derremate',
            'cedula' => '22222222',
            'email' => 'rematador@example.com',
            'telefono' => '099222222',
            'imagen' => null,
            'contrasenia' => Hash::make('123456'),
            'latitud' => -34.9011,
            'longitud' => -56.1645,
            'email_verified_at' => now(),
        ]);

        Rematador::create([
            'usuario_id' => $rematadorUsuario->id,
            'matricula' => 'MAT1234',
        ]);
    }
}
