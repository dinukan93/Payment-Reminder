<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

echo "Regenerating caller passwords with proper hashing...\n\n";

$callersData = [
    ['email' => 'ravi.perera@slt.lk', 'password' => 'Ravi@123'],
    ['email' => 'priya.silva@slt.lk', 'password' => 'Priya@123'],
    ['email' => 'chaminda.fernando@slt.lk', 'password' => 'Chaminda@123'],
    ['email' => 'nishantha.kumar@slt.lk', 'password' => 'Nishantha@123'],
    ['email' => 'kasun.jayasuriya@slt.lk', 'password' => 'Kasun@123'],
    ['email' => 'dilshan.wickramasinghe@slt.lk', 'password' => 'Dilshan@123'],
    ['email' => 'ananthan.raj@slt.lk', 'password' => 'Ananthan@123'],
    ['email' => 'vijay.kumar@slt.lk', 'password' => 'Vijay@123']
];

$updatedCount = 0;

foreach ($callersData as $data) {
    $hashedPassword = Hash::make($data['password']);
    
    DB::table('callers')
        ->where('email', $data['email'])
        ->update(['password' => $hashedPassword]);
    
    echo "✅ Updated password for: {$data['email']}\n";
    $updatedCount++;
}

echo "\n=== SUMMARY ===\n";
echo "Total Passwords Updated: $updatedCount\n";
echo "\nAll passwords have been properly hashed with Hash::make()\n";
