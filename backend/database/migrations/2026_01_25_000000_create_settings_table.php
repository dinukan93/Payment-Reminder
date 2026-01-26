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
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->enum('user_type', ['admin', 'caller']);
            $table->longText('avatar')->nullable();
            $table->boolean('email_notifications')->default(false);
            $table->boolean('payment_reminder')->default(false);
            $table->boolean('call_notifications')->default(false);
            $table->string('language')->default('English');
            $table->string('timezone')->default('UTC');
            $table->timestamps();

            // Create a composite unique index to ensure one settings record per user
            $table->unique(['user_id', 'user_type']);
            
            // Add indexes for better query performance
            $table->index('user_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
