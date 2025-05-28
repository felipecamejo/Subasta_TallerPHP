<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
   public function up()
{
    Schema::table('casa_remates', function (Blueprint $table) {
        $table->unsignedBigInteger('vendedor_id')->nullable()->after('id'); // o la posición que quieras
        $table->foreign('vendedor_id')->references('id')->on('vendedores')->onDelete('cascade');
    });
}

public function down()
{
    Schema::table('casa_remates', function (Blueprint $table) {
        $table->dropForeign(['vendedor_id']);
        $table->dropColumn('vendedor_id');
    });
}
};
