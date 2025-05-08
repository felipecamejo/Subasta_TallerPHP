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
        Schema::create('articulo_categoria', function (Blueprint $table) {
            
            $table->foreignId('articulo_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('categoria_id')->nullable()->constrained()->onDelete('cascade');
            
            $table->timestamps();
        });
        
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('articulo_categoria');
    }
};
