<?php

namespace Database\Seeders;

use App\Models\Usuario;
use App\Models\Cliente;
use App\Models\Rematador;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UsuarioSeeder extends Seeder
{
    public function run(): void
    {
        // Usuario tipo Cliente
        $clienteUsuario = Usuario::create([
            'nombre' => 'Steven Spielberg',
            'cedula' => '11111111',
            'email' => 'spielberg@example.com',
            'telefono' => '099111111',
            'imagen' => null,
            'contrasenia' => Hash::make('123456'),
            'latitud' => -34.9011,
            'longitud' => -56.1645,
        ]);

        Cliente::create([
            'usuario_id' => $clienteUsuario->id,
            'calificacion' => 5,
        ]);

        // Usuario tipo Rematador
        $rematadorUsuario = Usuario::create([
            'nombre' => 'Rematador Derremate',
            'cedula' => '22222222',
            'email' => 'rematador@example.com',
            'telefono' => '099222222',
            'imagen' => null,
            'contrasenia' => Hash::make('123456'),
            'latitud' => -34.9011,
            'longitud' => -56.1645,
        ]);

        Rematador::create([
            'usuario_id' => $rematadorUsuario->id,
            'matricula' => 'MAT1234',
        ]);
    }
}