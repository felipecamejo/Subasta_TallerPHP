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
        Schema::create('chat_valoraciones', function (Blueprint $table) {
            $table->id();
            $table->string('chat_id'); // ID del chat (ej: "private_1_2")
            $table->foreignId('valorador_id')->constrained('usuarios')->onDelete('cascade'); // Quien hizo la valoración
            $table->foreignId('valorado_id')->constrained('usuarios')->onDelete('cascade'); // Quien fue valorado
            $table->integer('puntuacion'); // La puntuación dada (1-5)
            $table->timestamps();
            
            // Evitar valoraciones duplicadas en el mismo chat
            $table->unique(['chat_id', 'valorador_id']);
            
            // Índices para consultas rápidas
            $table->index(['chat_id', 'valorador_id']);
            $table->index(['valorado_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chat_valoraciones');
    }
};
