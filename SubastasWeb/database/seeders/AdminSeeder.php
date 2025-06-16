<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Usuario;
use App\Models\Admin;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run()
    {
        // Crear el usuario si no existe
        $usuario = Usuario::firstOrCreate(
            ['email' => 'admin@admin.com'],
            [
                'nombre' => 'Admin Principal',
                'cedula' => '12345678',
                'telefono' => '099999999',
                'contrasenia' => Hash::make('123456789'),
                'email_verified_at' => now(),
            ]
        );

        // Asociarlo como admin si aún no está
        Admin::firstOrCreate([
            'usuario_id' => $usuario->id
        ]);
    }
}