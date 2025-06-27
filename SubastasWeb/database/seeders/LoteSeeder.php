<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Lote;
use App\Models\Subasta;

class LoteSeeder extends Seeder
{
    public function run(): void
    {
        $subasta = Subasta::find(1);

        if (!$subasta) {
            $this->command->warn('⚠️ Subasta con ID 1 no encontrada. Ejecutá SubastaSeeder primero.');
            return;
        }

        Lote::create([
            'id' => 1,
            'umbral' => 200,
            'pago' => false,
            'valorBase' => 200,
            'pujaMinima' => 210,
            'subasta_id' => $subasta->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Lote::create([
            'id' => 2,
            'umbral' => 0,
            'pago' => false,
            'valorBase' => 0,
            'pujaMinima' => 10,
            'subasta_id' => $subasta->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
