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
        Schema::create('notificacion_clientes', function (Blueprint $table) {
            $table->bigInteger('cliente_id');
            $table->foreign('cliente_id')->references('usuario_id')->on('clientes')->onDelete('cascade');

            $table->foreignId('notificacion_id')->nullable()->references('id')->on('notificaciones')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notificacion_clientes');
    }
};
