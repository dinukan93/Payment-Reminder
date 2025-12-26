<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // Update callers RTOM from full name to code
        DB::table('callers')->where('rtom', 'Kandy')->update(['rtom' => 'KA']);
    }

    public function down(): void
    {
        // Revert back
        DB::table('callers')->where('rtom', 'KA')->update(['rtom' => 'Kandy']);
    }
};
