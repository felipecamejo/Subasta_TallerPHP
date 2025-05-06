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
        Schema::create('subastas', function (Blueprint $table) {
            $table->id();
        
            $table->integer('duracionMinutos');
            $table->dateTime('fecha');
        
            $table->foreignId('casa_remate_id')->nullable()->constrained('casa_remates')->onDelete('cascade');
            $table->foreignId('rematador_id')->nullable()->constrained('rematadores')->onDelete('cascade');
        
            $table->timestamps();
        });
        
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subastas');
    }
};