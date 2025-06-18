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
        Schema::create('chats', function (Blueprint $table) {
            $table->id();
            $table->string('chat_id')->unique(); // Ej: "private_1_2"
            $table->foreignId('usuario1_id')->constrained('usuarios')->onDelete('cascade');
            $table->foreignId('usuario2_id')->constrained('usuarios')->onDelete('cascade');
            $table->timestamp('ultimo_mensaje_at')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();
            
            // Índices para optimizar consultas
            $table->index(['usuario1_id', 'usuario2_id']);
            $table->index('chat_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chats');
    }
};
