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
        Schema::create('puja_cliente', function (Blueprint $table) {
            $table->unsignedBigInteger('cliente_id')->nullable();
            $table->foreignId('puja_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreign('cliente_id')->references('usuario_id')->on('clientes')->onDelete('cascade');
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
