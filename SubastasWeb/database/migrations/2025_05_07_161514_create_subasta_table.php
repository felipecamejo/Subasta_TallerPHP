<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('subastas', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->integer('duracionMinutos');
            $table->boolean('activa');
            $table->dateTime('fecha');
            $table->decimal('latitud', 10, 6);
            $table->decimal('longitud', 10, 6);
            $table->string('videoId')->nullable();
            $table->unsignedBigInteger('rematador_id')->nullable();
            $table->unsignedBigInteger('casa_remate_id'); 
            $table->integer('loteIndex')->default(0);
            $table->timestamps(); //  sólo una vez

            // Relación con casa_remates
            $table->foreign('casa_remate_id')
                ->references('usuario_id') // clave primaria de casa_remates
                ->on('casa_remates')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subastas');
    }
};