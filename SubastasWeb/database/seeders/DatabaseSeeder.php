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
  AdminSeeder::class,             // Admin (sin relaciones)
  CategoriaSeeder::class,         // Necesaria para artículos

  CasaRemateSeeder::class,        // Crea usuario + casa remate
  RematadorSeeder::class,         // Crea usuario + rematador

  SubastaSeeder::class,           // Necesita casa_remate_id y rematador_id
  LoteSeeder::class,              // Necesita subasta_id

  ClienteSeeder::class,           // Crea usuario + cliente

  ArticuloSeeder::class,          // Necesita lote_id y categoria_id
  PujaSeeder::class               // Necesita cliente_id y lote_id
    ]);
}
}
