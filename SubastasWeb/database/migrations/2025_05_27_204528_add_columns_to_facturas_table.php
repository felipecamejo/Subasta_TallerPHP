<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
   public function up()
{
    Schema::table('facturas', function (Blueprint $table) {
        $table->decimal('monto_total', 10, 2)->after('vendedor_id');
        $table->string('condiciones_de_pago')->after('monto_total');
        $table->string('entrega')->after('condiciones_de_pago');
    });
}

public function down()
{
    Schema::table('facturas', function (Blueprint $table) {
        $table->dropColumn(['monto_total', 'condiciones_de_pago', 'entrega']);
    });
}
};
