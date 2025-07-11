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
        Schema::create('usuarios', function (Blueprint $table) {
            $table->id();
            
            $table->string('nombre');  
            $table->string('cedula'); 
            $table->string('email'); 
            $table->string('telefono'); 
            $table->string('imagen')->nullable(); 
            $table->decimal('latitud', 10, 7)->nullable();
            $table->decimal('longitud', 10, 7)->nullable();
            $table->string('contrasenia');
            $table->string('google_id')->nullable()->unique()->after('email');
            $table->timestamp('email_verified_at')->nullable()->after('email');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('usuarios');
    }
};
