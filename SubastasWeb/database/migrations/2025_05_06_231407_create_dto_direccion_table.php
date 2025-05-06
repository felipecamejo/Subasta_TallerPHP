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
        Schema::create('dto_direccion', function (Blueprint $table) {
            $table->id();
        
            $table->string('calle1');
            $table->string('calle2')->nullable();
            $table->string('numero');
            $table->string('ciudad');
            $table->string('pais');
        
            $table->unsignedBigInteger('direccionable_id');
            $table->string('direccionable_type');

            $table->timestamps();

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dto_direccion');
    }
};
