<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Change the status column from ENUM to VARCHAR to support any status value
        DB::statement("ALTER TABLE `filtered_customers` MODIFY COLUMN `status` VARCHAR(50) DEFAULT 'PENDING'");

        // Update existing lowercase values to uppercase for consistency
        DB::statement("UPDATE `filtered_customers` SET `status` = 'PENDING' WHERE `status` = 'pending'");
        DB::statement("UPDATE `filtered_customers` SET `status` = 'CONTACTED' WHERE `status` = 'contacted'");
        DB::statement("UPDATE `filtered_customers` SET `status` = 'COMPLETED' WHERE `status` IN ('paid', 'PAID')");
        DB::statement("UPDATE `filtered_customers` SET `status` = 'OVERDUE' WHERE `status` = 'overdue'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to ENUM
        DB::statement("ALTER TABLE `filtered_customers` MODIFY COLUMN `status` ENUM('pending', 'contacted', 'paid', 'overdue') DEFAULT 'pending'");
    }
};
