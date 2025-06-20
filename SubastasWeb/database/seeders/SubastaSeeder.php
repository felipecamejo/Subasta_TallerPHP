<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Subasta;
use App\Models\CasaRemate;

class SubastaSeeder extends Seeder
{
    public function run(): void
    {
        // Get the first casa_remate to use its usuario_id
        $casaRemate = CasaRemate::first();
        
        Subasta::create([
            'nombre' => 'alexis',
            'duracionMinutos' => 30,
            'activa' => false,
            'fecha' => '2025-08-02 10:00:00',
            'latitud' => -30.9011000,
            'longitud' => -50.1645000,
            'videoId' => 'DN8P7kukaGo',
            'rematador_id' => null,
            'casa_remate_id' => $casaRemate ? $casaRemate->usuario_id : null,
            'loteIndex' => 0,
        ]);

        Subasta::create([
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
        ]);
    }
}
