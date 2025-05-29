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
        Schema::create('pujas', function (Blueprint $table) {
            $table->id();

            $table->dateTime('fechaHora')->nullable();
            $table->float('monto')->nullable();
            
            $table->timestamps();

            $table->foreignId('lote_id')->nullable()->constrained('lotes')->onDelete('set null');
            $table->foreignId('factura_id')->nullable()->constrained('facturas')->onDelete('set null');
            $table->foreignId('cliente_id')->references('usuario_id')->on('clientes')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('_pujas');
    }
};
