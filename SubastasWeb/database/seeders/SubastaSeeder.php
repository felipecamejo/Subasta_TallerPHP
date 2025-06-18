<?php

namespace Database\Seeders;
use Illuminate\Database\Seeder;
use App\Models\Subasta;
use App\Models\CasaRemate;
use App\Models\Rematador;

class SubastaSeeder extends Seeder
{
    public function run(): void
    {
        $casaRemate = CasaRemate::first(); // o where('nombre', 'Casa de Remates Aurora')->first()
        $rematador = Rematador::first();   // o el que quieras

        if (!$casaRemate || !$rematador) {
            $this->command->warn('⚠️ No hay casa remate o rematador. Ejecutá los seeders correspondientes primero.');
            return;
        }

        Subasta::create([
            'nombre' => 'alexis',
            'duracionMinutos' => 30,
            'activa' => false,
            'fecha' => '2025-08-02 10:00:00',
            'latitud' => -30.9011,
            'longitud' => -50.1645,
            'videoId' => 'DN8P7kukaGo',
            'rematador_id' => $rematador->id,
            'casa_remate_id' => $casaRemate->usuario_id,
            'loteIndex' => 0,
        ]);
    }
}
