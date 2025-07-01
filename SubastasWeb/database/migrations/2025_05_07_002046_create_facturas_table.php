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
        Schema::create('facturas', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('puja_id'); 
            $table->float('monto_total');
            $table->string('condiciones_de_pago');
            $table->string('entrega');
            $table->foreignId('vendedor_id')->nullable()->constrained('vendedores')->cascadeOnDelete();
            
            $table->timestamps();

            // Agregar foreign key constraint para puja_id
            $table->foreign('puja_id')->references('id')->on('pujas')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('facturas');
    }
};
