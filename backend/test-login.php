<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Testing Admin Login...\n\n";

$user = App\Models\Admin::where('email', 'admin.colombo@slt.lk')->first();

if ($user) {
    echo "✓ User found: " . $user->email . "\n";
    echo "✓ Status: " . $user->status . "\n";
    echo "✓ Role: " . $user->role . "\n";
    
    $passwordCheck = Illuminate\Support\Facades\Hash::check('Admin@123', $user->password);
    echo "✓ Password check: " . ($passwordCheck ? "PASS ✓" : "FAIL ✗") . "\n";
} else {
    echo "✗ User NOT found in database\n";
}
