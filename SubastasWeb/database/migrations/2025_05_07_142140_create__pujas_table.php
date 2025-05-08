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
            $table->timestamps();

            $table->foreignId('lote_id')->constrained('lotes')->onDelete('set null');

            $table->foreignId('facturas_id')->nullable()->constrained('facturas')->onDelete('set null');

            $table->foreignId('cliente_id')->constrained('clientes')->onDelete('set null');

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
