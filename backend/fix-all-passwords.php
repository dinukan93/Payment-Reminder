<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Admin;
use Illuminate\Support\Facades\Hash;

echo "Updating all admin passwords...\n\n";

$admins = [
    ['email' => 'superadmin@slt.lk', 'password' => 'Super@123'],
    ['email' => 'admin.colombo@slt.lk', 'password' => 'Admin@123'],
    ['email' => 'admin.matara@slt.lk', 'password' => 'Admin@123'],
    ['email' => 'admin.negombo@slt.lk', 'password' => 'Admin@123'],
    ['email' => 'admin.kandy@slt.lk', 'password' => 'Admin@123'],
    ['email' => 'admin.kalutara@slt.lk', 'password' => 'Admin@123'],
    ['email' => 'uploader@slt.lk', 'password' => 'Upload@123'],
];

foreach ($admins as $adminData) {
    $updated = Admin::where('email', $adminData['email'])
        ->update(['password' => Hash::make($adminData['password'])]);
    
    if ($updated) {
        echo "✓ Updated: {$adminData['email']} -> {$adminData['password']}\n";
    } else {
        echo "✗ Failed: {$adminData['email']}\n";
    }
}

echo "\nAll passwords updated!\n";
