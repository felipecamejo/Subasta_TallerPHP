<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Puja;
use App\Models\Lote;

class PujaSeeder extends Seeder
{
    public function run(): void
    {
        // Verificar existencia de los lotes 1 y 2
        $lote1 = Lote::find(1);
        $lote2 = Lote::find(2);

        if (!$lote1 || !$lote2) {
            $this->command->warn('⚠️ Lotes 1 y/o 2 no encontrados. Ejecutá LoteSeeder primero.');
            return;
        }

        // Crear pujas para el lote 1
        Puja::create([
            'id' => 1,
            'fechaHora' => now()->subMinutes(20), 
            'monto' => 212,
            'lote_id' => $lote1->id,
            'factura_id' => null,
            'cliente_id' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Puja::create([
            'id' => 2,
            'fechaHora' => now()->subMinutes(18), 
            'monto' => 213,
            'lote_id' => $lote1->id,
            'factura_id' => null,
            'cliente_id' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Crear pujas para el lote 2
        Puja::create([
            'id' => 3,
            'fechaHora' => now()->subMinutes(15), 
            'monto' => 300,
            'lote_id' => $lote2->id,
            'factura_id' => null,
            'cliente_id' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Puja::create([
            'id' => 4,
            'fechaHora' => now(), 
            'monto' => 301,
            'lote_id' => $lote2->id,
            'factura_id' => null,
            'cliente_id' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
