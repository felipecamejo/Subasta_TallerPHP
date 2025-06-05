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
        Schema::create('articulos', function (Blueprint $table) {
            $table->id();

            $table->string('nombre');            
            $table->string('imagenes')->nullable(); 
            $table->string('especificacion');
            $table->boolean('disponibilidad');
            $table->string('condicion'); 
            $table->enum('estado', ['EXCELENTE', 'USADO']);
            
            $table->foreignId('vendedor_id')->nullable()->constrained('vendedores')->onDelete('cascade');
            $table->foreignId('lote_id')->nullable()->constrained('lotes')->onDelete('cascade');
            $table->foreignId('categoria_id')->nullable()->constrained('categorias')->onDelete('set null');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('articulos');
    }
};
