<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('casa_remates', function (Blueprint $table) {
            $table->id(); // Clave primaria estándar (id)
            $table->unsignedBigInteger('usuario_id')->unique(); // 👈 Relación única con usuarios

            $table->string('idFiscal');
            $table->json('calificacion')->default(json_encode([]))->nullable();
            $table->boolean('activo')->default(false);

            $table->string('aprobado_por')->nullable();   // ← nombre o email del admin
            $table->timestamp('aprobado_en')->nullable(); // ← fecha y hora de aprobación

            $table->timestamps();

            $table->foreign('usuario_id')->references('id')->on('usuarios')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('casa_remates');
    }
};
