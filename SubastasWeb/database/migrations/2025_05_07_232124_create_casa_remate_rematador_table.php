<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('casa_remate_rematador', function (Blueprint $table) {
            $table->id();

            // Foreign keys
            $table->foreignId('casa_remate_id')
                  ->constrained('casa_remates')
                  ->onDelete('cascade');

            $table->unsignedBigInteger('rematador_id');
            $table->foreign('rematador_id')
                  ->references('usuario_id')
                  ->on('rematadores')
                  ->onDelete('cascade');

            // Estado de la solicitud
            $table->enum('estado', ['pendiente', 'aprobado', 'rechazado'])->default('pendiente');

            // Fechas
            $table->timestamps();

            // Restricción única para evitar duplicados
            $table->unique(['casa_remate_id', 'rematador_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('casa_remate_rematador');
    }
};
