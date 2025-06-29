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
        Schema::create('valoraciones', function (Blueprint $table) {
            $table->id();
            $table->integer('total_puntaje')->default(0); // Suma total de todas las valoraciones
            $table->integer('cantidad_opiniones')->default(0); // Número de opiniones recibidas 

            $table->unsignedBigInteger('valorable_id')->nullable();

            $table->foreignId('usuario_id')->nullable()->constrained('usuarios')->onDelete('cascade');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('valoraciones');
    }
};
