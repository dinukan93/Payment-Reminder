<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Admin;

echo "Creating Regional and RTOM Admins...\n\n";

// Regional Admins
$regionalAdmins = [
    [
        'name' => 'Metro Region Admin',
        'email' => 'metro@slt.lk',
        'password' => 'Metro@123',
        'adminId' => 'ADM-REG-METRO',
        'phone' => '0771111111',
        'role' => 'region_admin',
        'region' => 'Metro',
        'rtom' => null,
        'status' => 'active'
    ],
    [
        'name' => 'Region 1 Admin',
        'email' => 'region01@slt.lk',
        'password' => 'Region01@123',
        'adminId' => 'ADM-REG-01',
        'phone' => '0772222222',
        'role' => 'region_admin',
        'region' => 'Region 1',
        'rtom' => null,
        'status' => 'active'
    ],
    [
        'name' => 'Region 2 Admin',
        'email' => 'region02@slt.lk',
        'password' => 'Region02@123',
        'adminId' => 'ADM-REG-02',
        'phone' => '0773333333',
        'role' => 'region_admin',
        'region' => 'Region 2',
        'rtom' => null,
        'status' => 'active'
    ],
    [
        'name' => 'Region 3 Admin',
        'email' => 'region03@slt.lk',
        'password' => 'Region03@123',
        'adminId' => 'ADM-REG-03',
        'phone' => '0774444444',
        'role' => 'region_admin',
        'region' => 'Region 3',
        'rtom' => null,
        'status' => 'active'
    ]
];

// RTOM Admins
$rtomAdmins = [
    [
        'name' => 'Colombo RTOM Admin',
        'email' => 'colombo@slt.lk',
        'password' => 'Colombo@123',
        'adminId' => 'ADM-RTOM-CO',
        'phone' => '0775555555',
        'role' => 'rtom_admin',
        'region' => 'Metro',
        'rtom' => 'CO',
        'status' => 'active'
    ],
    [
        'name' => 'Kandy RTOM Admin',
        'email' => 'kandy@slt.lk',
        'password' => 'Kandy@123',
        'adminId' => 'ADM-RTOM-KA',
        'phone' => '0776666666',
        'role' => 'rtom_admin',
        'region' => 'Region 1',
        'rtom' => 'KA',
        'status' => 'active'
    ],
    [
        'name' => 'Galle RTOM Admin',
        'email' => 'galle@slt.lk',
        'password' => 'Galle@123',
        'adminId' => 'ADM-RTOM-GA',
        'phone' => '0777777777',
        'role' => 'rtom_admin',
        'region' => 'Region 2',
        'rtom' => 'GA',
        'status' => 'active'
    ],
    [
        'name' => 'Jaffna RTOM Admin',
        'email' => 'jaffna@slt.lk',
        'password' => 'Jaffna@123',
        'adminId' => 'ADM-RTOM-JA',
        'phone' => '0778888888',
        'role' => 'rtom_admin',
        'region' => 'Region 3',
        'rtom' => 'JA',
        'status' => 'active'
    ]
];

echo "=== CREATING REGIONAL ADMINS ===\n";
foreach ($regionalAdmins as $adminData) {
    $admin = Admin::updateOrCreate(
        ['email' => $adminData['email']],
        $adminData
    );
    echo "✅ Created: {$admin->name} ({$admin->email}) - Region: {$admin->region}\n";
}

echo "\n=== CREATING RTOM ADMINS ===\n";
foreach ($rtomAdmins as $adminData) {
    $admin = Admin::updateOrCreate(
        ['email' => $adminData['email']],
        $adminData
    );
    echo "✅ Created: {$admin->name} ({$admin->email}) - RTOM: {$admin->rtom} (Region: {$admin->region})\n";
}

echo "\n=== SUMMARY ===\n";
echo "Total Regional Admins: " . count($regionalAdmins) . "\n";
echo "Total RTOM Admins: " . count($rtomAdmins) . "\n";
echo "\nAll users can now log in using their email and password.\n";
echo "Remember to select 'Admin' as the user type during login.\n";
