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
        Schema::create('chats_usuarios', function (Blueprint $table) {
            $table->foreignId('usuario_id')->references('id')->on('usuarios')->onDelete('cascade');
            $table->foreignId('chat_id')->nullable()->references('id')->on('chats')->onDelete('cascade');
            
            $table->boolean('valorado')->default(false);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chats_usuarios');
    }
};
