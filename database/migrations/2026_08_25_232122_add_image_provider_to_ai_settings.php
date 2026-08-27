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
        Schema::table('ai_provider_settings', function (Blueprint $table) {
            $table->string('image_provider')->default('custom')->after('image_enabled'); // custom|pexels
            $table->text('image_api_key')->nullable()->after('image_provider');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ai_provider_settings', function (Blueprint $table) {
            $table->dropColumn(['image_provider', 'image_api_key']);
        });
    }
};
