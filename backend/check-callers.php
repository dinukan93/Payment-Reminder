<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$count = DB::table('callers')->count();
echo "Total callers in database: $count\n\n";

if ($count > 0) {
    echo "Caller details:\n";
    $callers = DB::table('callers')->select('id', 'callerId', 'name', 'email', 'phone', 'status')->get();
    foreach ($callers as $caller) {
        echo "ID: {$caller->id}, Caller ID: {$caller->callerId}, Name: {$caller->name}, Email: {$caller->email}, Phone: {$caller->phone}, Status: {$caller->status}\n";
    }
} else {
    echo "No callers found. Running create-callers.php...\n";
}
