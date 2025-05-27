<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('casa_remates', function (Blueprint $table) {
            $table->id();
            
            $table->string('nombre');
            $table->string('idFiscal');
            $table->string('email');
            $table->string('telefono');
            $table->string('latitud');
            $table->string('longitud');
            $table->json('calificacion')->default(json_encode([]));

            $table->timestamps();
            
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('casa_remates');
    }
};
