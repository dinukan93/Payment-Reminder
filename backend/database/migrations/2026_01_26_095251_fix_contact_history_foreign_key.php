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
        Schema::table('contact_history', function (Blueprint $table) {
            // Drop the existing foreign key constraint
            $table->dropForeign(['customer_id']);

            // Add new foreign key constraint to filtered_customers table
            $table->foreign('customer_id')
                ->references('id')
                ->on('filtered_customers')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contact_history', function (Blueprint $table) {
            // Drop the filtered_customers foreign key
            $table->dropForeign(['customer_id']);

            // Restore the original foreign key to customers table
            $table->foreign('customer_id')
                ->references('id')
                ->on('customers')
                ->onDelete('cascade');
        });
    }
};
