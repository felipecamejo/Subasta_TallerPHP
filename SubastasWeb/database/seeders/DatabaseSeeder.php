<?php

namespace Database\Seeders;

use App\Models\Usuario;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        Usuario::factory()->create([
            'nombre' => 'Test User',
            'email' => 'test@example.com',
            'cedula' => '12345678', // valor de prueba
            'telefono' => '099123456',
            'contrasenia' => Hash::make('123456'),  // Aquí la contraseña hasheada
        ]);
    }
}
