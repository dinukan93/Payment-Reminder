<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    echo "Testing RequestController...\n\n";

    // Test if classes exist
    echo "1. Checking if classes exist:\n";
    echo "   - Caller class exists: " . (class_exists('App\Models\Caller') ? 'YES' : 'NO') . "\n";
    echo "   - Admin class exists: " . (class_exists('App\Models\Admin') ? 'YES' : 'NO') . "\n";
    echo "   - TaskRequest class exists: " . (class_exists('App\Models\Request') ? 'YES' : 'NO') . "\n\n";

    // Test database connection
    echo "2. Testing database connection:\n";
    $pdo = DB::connection()->getPdo();
    echo "   - Database connected: YES\n";
    echo "   - Driver: " . $pdo->getAttribute(PDO::ATTR_DRIVER_NAME) . "\n\n";

    // Test if tables exist
    echo "3. Checking if tables exist:\n";
    $tables = ['callers', 'admins', 'requests', 'filtered_customers'];
    foreach ($tables as $table) {
        $exists = Schema::hasTable($table);
        echo "   - $table: " . ($exists ? 'EXISTS' : 'MISSING') . "\n";
    }
    echo "\n";

    // Test fetching a caller
    echo "4. Testing Caller model:\n";
    $caller = App\Models\Caller::first();
    if ($caller) {
        echo "   - Found caller: " . $caller->name . " (ID: " . $caller->id . ")\n";
    } else {
        echo "   - No callers found in database\n";
    }
    echo "\n";

    // Test fetching requests
    echo "5. Testing Request model:\n";
    $request = App\Models\Request::first();
    if ($request) {
        echo "   - Found request: Task ID " . $request->task_id . "\n";
    } else {
        echo "   - No requests found in database\n";
    }
    echo "\n";

    echo "All tests completed successfully!\n";

} catch (\Exception $e) {
    echo "\n❌ ERROR: " . $e->getMessage() . "\n";
    echo "\nStack trace:\n" . $e->getTraceAsString() . "\n";
}
