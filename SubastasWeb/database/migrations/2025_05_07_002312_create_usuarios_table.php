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
        Schema::create('usuarios', function (Blueprint $table) {
            $table->id();
            
            $table->string('nombre');  // Nombre del usuario
            $table->string('cedula'); // Cédula del usuario
            $table->string('email'); // Correo electrónico del usuario
            $table->string('telefono'); // Teléfono del usuario
            $table->string('imagen'); // Imagen del usuario 
            $table->string('direccionFiscal'); // Dirección fiscal del usuario
            
            $table->string('contrasenia');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('usuarios');
    }
};
