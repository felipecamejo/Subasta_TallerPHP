<?php

namespace Database\Seeders;

use App\Models\Articulo;
use App\Models\CasaRemate;
use App\Models\Categoria;
use App\Models\Subasta;
use App\Models\Lote;
use App\Models\Puja;
use App\Models\Usuario;
use App\Models\Cliente;
use App\Models\Rematador;
use App\Models\Valoracion;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            AdminSeeder::class,
            CasaRemateSeeder::class,
            ClienteSeeder::class,
            RematadorSeeder::class,  
            SubastaSeeder::class,
            LoteSeeder::class,
            //PujaSeeder::class,
            CategoriaSeeder::class,
            ArticuloSeeder::class,
        ]);
    }
}
