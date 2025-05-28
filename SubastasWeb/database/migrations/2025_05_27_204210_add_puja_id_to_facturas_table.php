<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
public function up()
{
    Schema::table('facturas', function (Blueprint $table) {
        $table->unsignedBigInteger('puja_id')->nullable()->after('id'); // Agrega la columna
        $table->foreign('puja_id')->references('id')->on('pujas')->onDelete('set null'); // Llave foránea (opcional)
    });
}

public function down()
{
    Schema::table('facturas', function (Blueprint $table) {
        $table->dropForeign(['puja_id']);
        $table->dropColumn('puja_id');
    });
}
};
