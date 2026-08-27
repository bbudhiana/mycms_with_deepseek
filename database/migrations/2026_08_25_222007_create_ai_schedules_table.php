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
        Schema::create('ai_schedules', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->boolean('is_active')->default(true);
            $table->string('type')->default('daily'); // daily|weekly
            $table->unsignedTinyInteger('day_of_week')->nullable(); // 1-7 (ISO), only for weekly
            $table->string('tone')->default('editorial'); // editorial|konvensional|teknis|santai|ceria
            $table->text('topic_direction');
            $table->string('language')->default('id');
            $table->string('publish_time'); // H:i local target
            $table->integer('content_count')->default(1);
            $table->boolean('auto_publish')->default(false);
            $table->string('status')->default('idle'); // idle|running|ok|failed
            $table->timestamp('last_run_at')->nullable();
            $table->text('last_error')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_schedules');
    }
};
