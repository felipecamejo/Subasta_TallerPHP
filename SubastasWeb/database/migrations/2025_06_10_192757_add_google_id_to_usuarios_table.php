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
        Schema::table('usuarios', function (Blueprint $table) {
            // Añadir la columna google_id
            $table->string('google_id')->nullable()->unique()->after('email');
            // 'nullable()' permite que los usuarios existentes que no se registraron con Google no tengan este campo.
            // 'unique()' asegura que cada google_id solo se vincule a un usuario en tu sistema.
            // 'after('email')' es opcional y solo define la posición de la columna en la tabla.
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('usuarios', function (Blueprint $table) {
            // Eliminar la columna google_id si se revierte la migración
            $table->dropColumn('google_id');
        });
    }
};
