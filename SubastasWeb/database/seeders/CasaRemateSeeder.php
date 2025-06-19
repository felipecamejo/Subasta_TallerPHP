<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Usuario;
use App\Models\CasaRemate;
use App\Models\Valoracion;

class CasaRemateSeeder extends Seeder
{
    public function run(): void
    {
        $usuario = Usuario::create([
            'nombre' => 'Casa de Remates Aurora',
            'email' => 'cocoarodri@gmail.com',
            'cedula' => '212345670018', // Usamos el idFiscal como cedula para casas de remate
            'telefono' => '099123456',
            'contrasenia' => bcrypt('12345678'),
            'latitud' => -34.9011,
            'longitud' => -56.1645,
            'email_verified_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Crear la casa de remate
        $casaRemate = CasaRemate::create([
            'usuario_id' => $usuario->id,
            'idFiscal' => '212345670018',
        ]);
        
        // Crear una valoración para la casa de remate
        $casaRemate->valoracion()->create([
            'valoracion_total' => 23, // Suma de las calificaciones: 4.5 + 4.8 + 4.2 + 5.0 + 4.7 = 23.2, redondeado a 23
            'cantidad_opiniones' => 5
        ]);
    }
}
