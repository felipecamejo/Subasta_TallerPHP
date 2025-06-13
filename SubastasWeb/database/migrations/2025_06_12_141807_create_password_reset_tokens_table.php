<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->id(); // Por si querés un ID único (opcional)
            $table->string('email')->index();
            $table->string('token');
            $table->timestamp('created_at')->default(DB::raw('CURRENT_TIMESTAMP'));
        });
    }

    public function down(): void {
        Schema::dropIfExists('password_reset_tokens');
    }
};