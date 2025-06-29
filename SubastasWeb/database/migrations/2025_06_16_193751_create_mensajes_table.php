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
        Schema::create('mensajes', function (Blueprint $table) {
            $table->id();
            $table->text('contenido');
            $table->timestamp('enviado_at')->useCurrent();
            $table->boolean('leido')->default(false);
            $table->enum('tipo', ['texto', 'imagen', 'archivo'])->default('texto');
            
            $table->foreignId('chat_id')->constrained('chats')->onDelete('cascade');
            $table->foreignId('usuario_id')->constrained('usuarios')->onDelete('cascade');
            $table->index(['chat_id', 'enviado_at']);
            $table->index(['usuario_id', 'enviado_at']);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mensajes');
    }
};
