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
        // First, update existing data from full names to codes
        DB::statement("ALTER TABLE callers MODIFY rtom VARCHAR(50)");

        DB::table('callers')->where('rtom', 'Colombo')->update(['rtom' => 'CO']);
        DB::table('callers')->where('rtom', 'Matara')->update(['rtom' => 'MA']);
        DB::table('callers')->where('rtom', 'Negombo')->update(['rtom' => 'NE']);
        DB::table('callers')->where('rtom', 'Kandy')->update(['rtom' => 'KA']);
        DB::table('callers')->where('rtom', 'Kalutara')->update(['rtom' => 'KL']);

        // Now change the column to use 2-letter codes
        DB::statement("ALTER TABLE callers MODIFY rtom ENUM('CO', 'MA', 'NE', 'KA', 'KL')");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to full names
        DB::statement("ALTER TABLE callers MODIFY rtom VARCHAR(50)");

        DB::table('callers')->where('rtom', 'CO')->update(['rtom' => 'Colombo']);
        DB::table('callers')->where('rtom', 'MA')->update(['rtom' => 'Matara']);
        DB::table('callers')->where('rtom', 'NE')->update(['rtom' => 'Negombo']);
        DB::table('callers')->where('rtom', 'KA')->update(['rtom' => 'Kandy']);
        DB::table('callers')->where('rtom', 'KL')->update(['rtom' => 'Kalutara']);

        DB::statement("ALTER TABLE callers MODIFY rtom ENUM('Colombo', 'Matara', 'Negombo', 'Kandy', 'Kalutara')");
    }
};
