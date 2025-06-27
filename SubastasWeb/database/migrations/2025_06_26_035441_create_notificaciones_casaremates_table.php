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
        Schema::create('notificaciones_casaremates', function (Blueprint $table) {
            $table->bigInteger('casa_remate_id');
            $table->foreign('casa_remate_id')->references('usuario_id')->on('casa_remates')->onDelete('cascade');

            $table->foreignId('notificacion_id')->nullable()->references('id')->on('notificaciones')->onDelete('cascade');
            $table->boolean('leido')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notificaciones_casaremates');
    }
};
