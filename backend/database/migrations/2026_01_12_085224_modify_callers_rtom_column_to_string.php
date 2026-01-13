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
        Schema::table('callers', function (Blueprint $table) {
            // Change rtom from enum to string to support RTOM codes
            $table->string('rtom', 10)->nullable()->change();

            // Add region column if it doesn't exist
            if (!Schema::hasColumn('callers', 'region')) {
                $table->string('region', 50)->nullable()->after('rtom');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('callers', function (Blueprint $table) {
            // Revert rtom back to enum (optional, can be left as string)
            // Note: Reverting to enum might cause data loss if values don't match
            $table->dropColumn('region');
        });
    }
};
