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
            $table->boolean('image_enabled')->default(false);
        });

        Schema::table('ai_schedules', function (Blueprint $table) {
            $table->foreignId('author_id')->nullable()->after('id')->constrained('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ai_provider_settings', function (Blueprint $table) {
            $table->dropColumn('image_enabled');
        });

        Schema::table('ai_schedules', function (Blueprint $table) {
            $table->dropConstrainedForeignId('author_id');
        });
    }
};
