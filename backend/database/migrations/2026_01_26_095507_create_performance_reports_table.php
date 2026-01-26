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
        Schema::create('performance_reports', function (Blueprint $table) {
            $table->id();
            $table->string('report_id')->unique(); // e.g., "RPT-20260126-001"
            $table->unsignedBigInteger('caller_id');
            $table->enum('report_type', ['daily', 'weekly', 'monthly']);
            $table->json('stats'); // totalCalls, successfulCalls, totalPayments, etc.
            $table->json('customer_details'); // Array of customer analytics
            $table->timestamp('generated_date');
            $table->timestamps();

            // Foreign key to callers table
            $table->foreign('caller_id')
                ->references('id')
                ->on('callers')
                ->onDelete('cascade');

            // Indexes for faster queries
            $table->index('caller_id');
            $table->index('report_type');
            $table->index('generated_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('performance_reports');
    }
};
