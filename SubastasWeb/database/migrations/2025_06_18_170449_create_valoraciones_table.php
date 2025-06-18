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
        Schema::create('valoraciones', function (Blueprint $table) {
            $table->id();
            $table->integer('valoracion_total')->default(0); // Suma total de todas las valoraciones
            $table->integer('cantidad_opiniones')->default(0); // Número de opiniones recibidas
            $table->string('valorable_type'); // Tipo de modelo (Cliente, CasaRemate, etc.)
            $table->unsignedBigInteger('valorable_id'); // ID del modelo valorado
            $table->timestamps();
            
            // Índice para la relación polimórfica
            $table->index(['valorable_type', 'valorable_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('valoraciones');
    }
};
