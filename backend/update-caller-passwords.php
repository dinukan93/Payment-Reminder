<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Caller;
use Illuminate\Support\Facades\Hash;

echo "Updating caller passwords...\n\n";

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
    $caller = Caller::where('email', $data['email'])->first();
    
    if ($caller) {
        $caller->password = Hash::make($data['password']);
        $caller->save();
        echo "✅ Updated: {$caller->name} ({$caller->email})\n";
        $updatedCount++;
    } else {
        echo "❌ Not found: {$data['email']}\n";
    }
}

echo "\n=== SUMMARY ===\n";
echo "Total Passwords Updated: $updatedCount\n";
