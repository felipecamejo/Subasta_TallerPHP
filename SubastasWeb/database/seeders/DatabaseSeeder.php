<?php

namespace Database\Seeders;


use App\Models\Subasta;
use App\Models\Lote;
use App\Models\Puja;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void {

        Subasta::create([
            'id' => 1,
            'nombre' => 'alexis',
            'duracionMinutos' => 30,
            'activa' => false,
            'fecha' => '2025-08-02 10:00:00',
            'latitud' => -30.9011000,
            'longitud' => -50.1645000,
            'videoId' => 'DN8P7kukaGo',
            'rematador_id' => null,
            'casa_remate_id' => null,
            'loteIndex' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Subasta::create([
            'id' => 2,
            'nombre' => 'leo',
            'duracionMinutos' => 30,
            'activa' => false,
            'fecha' => '2025-08-02 12:00:00',
            'latitud' => -34.9011,
            'longitud' => -56.1645,
            'videoId' => null,
            'rematador_id' => null,
            'casa_remate_id' => null,
            'loteIndex' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Lote::create([
            'id' => 1,
            'valorBase' => 200,
            'pujaMinima' => 210,
            'subasta_id' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Lote::create([
            'id' => 2,
            'valorBase' => 0,
            'pujaMinima' => 10,
            'subasta_id' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Puja::create([
            'id' => 1,
            'fechaHora' => now()->subMinutes(20), 
            'monto' => 212,
            'lote_id' => 1,
            'factura_id' => null,
            'cliente_id' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Puja::create([
            'id' => 2,
            'fechaHora' => now()->subMinutes(18), 
            'monto' => 213,
            'lote_id' => 1,
            'factura_id' => null,
            'cliente_id' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Puja::create([
            'id' => 3,
            'fechaHora' => now()->subMinutes(15), 
            'monto' => 300,
            'lote_id' => 2,
            'factura_id' => null,
            'cliente_id' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Puja::create([
            'id' => 4,
            'fechaHora' => now(), 
            'monto' => 301,
            'lote_id' => 2,
            'factura_id' => null,
            'cliente_id' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);


    }
}
