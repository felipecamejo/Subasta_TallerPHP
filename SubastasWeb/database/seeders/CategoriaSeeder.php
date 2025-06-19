<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Categoria;

class CategoriaSeeder extends Seeder
{
    public function run(): void
    {
        Categoria::create([
            'id' => 1,
            'nombre' => 'Electrónica',
            'categoria_padre_id' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Categoria::create([
            'id' => 2,
            'nombre' => 'Telefonos',
            'categoria_padre_id' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Categoria::create([
            'id' => 3,
            'nombre' => 'Muebles',
            'categoria_padre_id' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
