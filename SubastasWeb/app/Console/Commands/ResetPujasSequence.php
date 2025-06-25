<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ResetPujasSequence extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'pujas:reset-sequence';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reset the pujas table sequence to avoid unique constraint violations';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        try {
            // Obtener el ID máximo actual
            $maxId = DB::table('pujas')->max('id') ?? 0;
            $nextId = $maxId + 1;

            // Resetear la secuencia
            DB::statement("SELECT setval('pujas_id_seq', $nextId)");

            $this->info("Secuencia de pujas_id_seq reseteada exitosamente.");
            $this->info("Próximo ID que se asignará: $nextId");

            return 0;
        } catch (\Exception $e) {
            $this->error("Error al resetear la secuencia: " . $e->getMessage());
            return 1;
        }
    }
}
