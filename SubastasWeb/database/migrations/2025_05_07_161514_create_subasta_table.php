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
            $table->decimal('latitud', 10, 7);
            $table->decimal('longitud', 10, 7);

        
            $table->foreignId('casa_remate_id')->nullable()->constrained('casa_remates')->onDelete('cascade');
            
            $table->unsignedBigInteger('rematador_id')->nullable();
            $table->foreign('rematador_id')->references('usuario_id')->on('rematadores')->onDelete('cascade');

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