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
        Schema::create('rematadores', function (Blueprint $table) {
            $table->unsignedBigInteger('usuario_id')->primary(); // PRIMARY KEY
            $table->string('matricula');
            
            $table->foreign('usuario_id')->references('id')->on('usuarios')->onDelete('cascade'); // FOREIGN KEY
        
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rematadores');
    }
};