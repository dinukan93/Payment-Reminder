<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Caller;
use Illuminate\Support\Facades\Hash;

echo "Creating Callers...\n\n";

// Sample callers for different RTOMs and Regions
$callersData = [
    // Colombo RTOM (CO) - Metro
    [
        'callerId' => 'CALLER-CO-001',
        'name' => 'Ravi Perera',
        'email' => 'ravi.perera@slt.lk',
        'phone' => '0771111101',
        'password' => 'Ravi@123',
        'maxLoad' => 25,
        'status' => 'active',
        'taskStatus' => 'available',
        'rtom' => 'CO',
        'region' => 'Metro',
        'created_by' => 2
    ],
    [
        'callerId' => 'CALLER-CO-002',
        'name' => 'Priya Silva',
        'email' => 'priya.silva@slt.lk',
        'phone' => '0771111102',
        'password' => 'Priya@123',
        'maxLoad' => 25,
        'status' => 'active',
        'taskStatus' => 'available',
        'rtom' => 'CO',
        'region' => 'Metro',
        'created_by' => 2
    ],
    
    // Kandy RTOM (KA) - Region 1
    [
        'callerId' => 'CALLER-KA-001',
        'name' => 'Chaminda Fernando',
        'email' => 'chaminda.fernando@slt.lk',
        'phone' => '0772222201',
        'password' => 'Chaminda@123',
        'maxLoad' => 25,
        'status' => 'active',
        'taskStatus' => 'available',
        'rtom' => 'KA',
        'region' => 'Region 1',
        'created_by' => 3
    ],
    [
        'callerId' => 'CALLER-KA-002',
        'name' => 'Nishantha Kumar',
        'email' => 'nishantha.kumar@slt.lk',
        'phone' => '0772222202',
        'password' => 'Nishantha@123',
        'maxLoad' => 25,
        'status' => 'active',
        'taskStatus' => 'available',
        'rtom' => 'KA',
        'region' => 'Region 1',
        'created_by' => 3
    ],
    
    // Matara RTOM (MA) - Region 2
    [
        'callerId' => 'CALLER-MA-001',
        'name' => 'Kasun Jayasuriya',
        'email' => 'kasun.jayasuriya@slt.lk',
        'phone' => '0773333301',
        'password' => 'Kasun@123',
        'maxLoad' => 25,
        'status' => 'active',
        'taskStatus' => 'available',
        'rtom' => 'MA',
        'region' => 'Region 2',
        'created_by' => 4
    ],
    [
        'callerId' => 'CALLER-MA-002',
        'name' => 'Dilshan Wickramasinghe',
        'email' => 'dilshan.wickramasinghe@slt.lk',
        'phone' => '0773333302',
        'password' => 'Dilshan@123',
        'maxLoad' => 25,
        'status' => 'active',
        'taskStatus' => 'available',
        'rtom' => 'MA',
        'region' => 'Region 2',
        'created_by' => 4
    ],
    
    // Negombo RTOM (NE) - Region 3
    [
        'callerId' => 'CALLER-NE-001',
        'name' => 'Ananthan Raj',
        'email' => 'ananthan.raj@slt.lk',
        'phone' => '0774444401',
        'password' => 'Ananthan@123',
        'maxLoad' => 25,
        'status' => 'active',
        'taskStatus' => 'available',
        'rtom' => 'NE',
        'region' => 'Region 3',
        'created_by' => 5
    ],
    [
        'callerId' => 'CALLER-NE-002',
        'name' => 'Vijay Kumar',
        'email' => 'vijay.kumar@slt.lk',
        'phone' => '0774444402',
        'password' => 'Vijay@123',
        'maxLoad' => 25,
        'status' => 'active',
        'taskStatus' => 'available',
        'rtom' => 'NE',
        'region' => 'Region 3',
        'created_by' => 5
    ]
];

$createdCount = 0;

foreach ($callersData as $callerData) {
    // Check if caller already exists
    $existing = Caller::where('email', $callerData['email'])->first();
    
    if ($existing) {
        echo "⏭️  Skipped: {$callerData['name']} ({$callerData['email']}) - Already exists\n";
    } else {
        // Hash the password
        $callerData['password'] = Hash::make($callerData['password']);
        
        $caller = Caller::create($callerData);
        echo "✅ Created: {$callerData['name']} ({$callerData['email']}) - RTOM: {$callerData['rtom']}\n";
        $createdCount++;
    }
}

echo "\n=== SUMMARY ===\n";
echo "Total Callers Created: $createdCount\n";
echo "\nAll callers can now log in using their email and password.\n";
echo "Remember to select 'Caller' as the user type during login.\n";
