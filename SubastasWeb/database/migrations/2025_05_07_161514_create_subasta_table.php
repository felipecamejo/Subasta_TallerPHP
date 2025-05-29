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
        
            $table->string('nombre');
            $table->integer('duracionMinutos')->default(0);
            $table->boolean('activa');
            $table->dateTime('fecha');
            $table->decimal('latitud', 10, 7);
            $table->decimal('longitud', 10, 7);

        
            $table->foreignId('casa_remate_id')->nullable()->constrained('casa_remates')->onDelete('cascade');
            
            $table->foreignId('rematador_id')->nullable()->references('usuario_id')->on('rematadores')->onDelete('cascade');

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