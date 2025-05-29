<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
{
    Schema::table('pujas', function (Blueprint $table) {
        $table->unsignedBigInteger('cliente_id')->nullable();
        $table->foreign('cliente_id')->references('usuario_id')->on('clientes')->nullOnDelete();
    });
}

public function down(): void
{
    Schema::table('pujas', function (Blueprint $table) {
        $table->dropForeign(['cliente_id']);
        $table->dropColumn('cliente_id');
    });
}
};
