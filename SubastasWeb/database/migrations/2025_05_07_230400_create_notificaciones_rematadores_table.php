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
        Schema::create('notificacion_rematadores', function (Blueprint $table) {
            $table->unsignedBigInteger('rematador_id');
            $table->foreign('rematador_id')->references('usuario_id')->on('rematadores')->onDelete('cascade');

            $table->foreignId('notificacion_id')->nullable()->references('id')->on('notificaciones')->onDelete('cascade');
            $table->boolean('leido')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notificacion_rematadores');
    }
};
