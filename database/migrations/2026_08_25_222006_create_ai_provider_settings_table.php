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
        Schema::create('ai_provider_settings', function (Blueprint $table) {
            $table->id();
            $table->string('base_url');
            $table->text('api_key')->nullable();
            $table->string('model')->default('gpt-4o-mini');
            $table->string('provider')->default('openai-compatible');
            $table->decimal('temperature', 3, 2)->default(0.7);
            $table->integer('max_tokens')->default(8192);
            $table->string('image_endpoint_url')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_provider_settings');
    }
};
