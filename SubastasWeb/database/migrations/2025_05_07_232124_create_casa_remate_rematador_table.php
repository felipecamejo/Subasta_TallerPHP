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
        Schema::create('casa_remate_rematador', function (Blueprint $table) {
            $table->unsignedBigInteger('rematador_id');
            
            $table->foreignId('casa_remate_id')->references('id')->on('casa_remates')->onDelete('cascade');
            $table->foreign('rematador_id')->references('usuario_id')->on('rematadores')->onDelete('cascade');

            $table->timestamps();
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
