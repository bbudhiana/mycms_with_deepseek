<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ai_schedules', function (Blueprint $table) {
            $table->foreignId('category_id')->nullable()->after('topic_direction')->constrained('categories')->nullOnDelete();
            $table->json('tags')->nullable()->after('category_id');
        });
    }

    public function down(): void
    {
        Schema::table('ai_schedules', function (Blueprint $table) {
            $table->dropConstrainedForeignId('category_id');
            $table->dropColumn('tags');
        });
    }
};
