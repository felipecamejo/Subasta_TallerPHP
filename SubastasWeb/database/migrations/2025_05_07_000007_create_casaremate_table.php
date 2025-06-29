<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('casa_remates', function (Blueprint $table) {
            $table->unsignedBigInteger('usuario_id')->primary(); 
            $table->string('idFiscal')->unique();
            $table->boolean('activo')->default(false);
            $table->string('aprobado_por')->nullable();   
            $table->timestamp('aprobado_en')->nullable(); 
            
            $table->foreign('usuario_id')->references('id')->on('usuarios')->onDelete('cascade');

            $table->unsignedBigInteger('vendedor_id')->nullable()->after('id'); // o la posición que quieras
            $table->foreign('vendedor_id')->references('id')->on('vendedores')->onDelete('cascade');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('casa_remates');
    }
};
