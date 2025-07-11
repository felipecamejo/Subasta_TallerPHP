<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\Usuario;
use App\Models\Cliente;
use Illuminate\Support\Facades\DB;

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

        // Creamos el cliente
        $cliente = Cliente::create([
            'usuario_id' => $clienteUsuario->id,
        ]);
        
        // Insertar valoración solo con los campos válidos
        DB::table('valoraciones')->insert([
            'total_puntaje' => 20, // 20 puntos en total 
            'cantidad_opiniones' => 4, // 4 opiniones recibidas (promedio será 5.0)
            'usuario_id' => $clienteUsuario->id,
            'created_at' => now(),
            'updated_at' => now(),
            'valorable_id' => 4,
        ]);

        $clienteUsuario = Usuario::create([
            'nombre' => 'Audrey Hepburn',
            'cedula' => '333323233',
            'email' => 'audreyhepburn@example.com',
            'telefono' => '09932211',
            'imagen' => null,
            'contrasenia' => Hash::make('123456789'),
            'latitud' => -30.9011,
            'longitud' => -60.1645,
            'email_verified_at' => now(),
        ]);

        Cliente::create([
            'usuario_id' => $clienteUsuario->id,
        ]);
    }
}
