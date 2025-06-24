<?php

use Illuminate\Support\Facades\DB;

// Resetear la secuencia de pujas
$maxId = DB::table('pujas')->max('id') ?? 0;
$nextId = $maxId + 1;

DB::statement("SELECT setval('pujas_id_seq', $nextId)");

echo "Secuencia de pujas_id_seq reseteada. Próximo ID: $nextId\n";
