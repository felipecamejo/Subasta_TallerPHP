<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Usuario;
use App\Models\CasaRemate;

class CasaRemateSeeder extends Seeder
{
    public function run(): void
    {
        $usuario = Usuario::create([
            'nombre' => 'Casa de Remates Aurora',
            'email' => 'cocoarodri@gmail.com',
            'cedula' => '', // No aplica para casa de remate
            'telefono' => '099123456',
            'contrasenia' => bcrypt('12345678'),
            'latitud' => -34.9011,
            'longitud' => -56.1645,
            'email_verified_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        CasaRemate::create([
            'usuario_id' => $usuario->id,
            'idFiscal' => '212345670018',
            'activo' => true,
            'aprobado_por' => 'admin',
            'aprobado_en' => now(),
            'calificacion' => [4.5, 4.8, 4.2, 5.0, 4.7],
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
