<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->string('user_type')->nullable(); // 'admin' or 'caller'
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('user_email')->nullable();
            $table->string('action'); // 'login', 'logout', 'create', 'update', 'delete', etc.
            $table->string('model')->nullable(); // Model class name (Admin, Caller, Customer, etc.)
            $table->unsignedBigInteger('model_id')->nullable(); // ID of affected model
            $table->text('description')->nullable(); // Human-readable description
            $table->json('old_values')->nullable(); // Before update
            $table->json('new_values')->nullable(); // After update
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->string('url')->nullable();
            $table->string('method', 10)->nullable(); // GET, POST, PUT, DELETE
            $table->timestamps();

            // Indexes for faster queries
            $table->index(['user_type', 'user_id']);
            $table->index('action');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
