<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Caller;
use Illuminate\Support\Facades\Hash;

echo "Testing password verification...\n\n";

// Get a caller from database
$caller = Caller::where('email', 'chaminda.fernando@slt.lk')->first();

if (!$caller) {
    echo "❌ Caller not found in database\n";
    exit;
}

echo "Caller: {$caller->name}\n";
echo "Email: {$caller->email}\n";
echo "Stored Password Hash: {$caller->password}\n\n";

// Test password verification
$testPassword = 'Chaminda@123';
$isMatch = Hash::check($testPassword, $caller->password);

echo "Testing password: {$testPassword}\n";
echo "Hash::check() result: " . ($isMatch ? '✅ TRUE' : '❌ FALSE') . "\n\n";

if ($isMatch) {
    echo "✅ Password verification works correctly!\n";
} else {
    echo "❌ Password verification failed!\n";
    echo "\nTrying to create a new hash for verification:\n";
    $newHash = Hash::make($testPassword);
    echo "New hash: {$newHash}\n";
    echo "Hash::check() with new hash: " . (Hash::check($testPassword, $newHash) ? '✅ TRUE' : '❌ FALSE') . "\n";
}
