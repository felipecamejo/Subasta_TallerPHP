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

            $table->float('montoTotal');
            $table->string('condicionesDePago');
            $table->string('entrega');
            $table->foreignId('vendedor_id')->constrained('vendedores')->cascadeOnDelete();
            
            $table->unsignedBigInteger('puja_id')->nullable()->after('id'); 
            

            $table->timestamps();

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
