<?php


require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Admin;
use App\Models\Caller;

echo "========================================\n";
echo "  PAYMENT REMINDER - ALL ACCOUNTS SETUP\n";
echo "========================================\n\n";

// ==========================================
// SUPERADMIN ACCOUNT
// ==========================================
echo "Creating Superadmin...\n";

$superadmin = Admin::updateOrCreate(
    ['email' => 'superadmin@slt.lk'],
    [
        'adminId' => 'SUPERADMIN001',
        'name' => 'Super Administrator',
        'email' => 'superadmin@slt.lk',
        'password' => 'Super@123',
        'phone' => '0771234567',
        'role' => 'superadmin',
        'region' => null,
        'rtom' => null,
        'status' => 'active'
    ]
);
echo "✅ Superadmin created\n\n";

// ==========================================
// UPLOADER ACCOUNT
// ==========================================
echo "Creating Uploader...\n";

$uploader = Admin::updateOrCreate(
    ['email' => 'uploader@slt.lk'],
    [
        'adminId' => 'UPLOADER001',
        'name' => 'Data Uploader',
        'email' => 'uploader@slt.lk',
        'password' => 'Upload@123',
        'phone' => '0779999999',
        'role' => 'uploader',
        'region' => null,
        'rtom' => null,
        'status' => 'active'
    ]
);
echo "✅ Uploader created\n\n";

// ==========================================
// REGIONAL ADMINS
// ==========================================
echo "Creating Regional Admins...\n";

$regionalAdmins = [
    [
        'adminId' => 'RADM-WESTERN',
        'name' => 'Western Region Admin',
        'email' => 'western@slt.lk',
        'password' => 'Western@123',
        'phone' => '0112345001',
        'role' => 'region_admin',
        'region' => 'Western',
        'rtom' => null,
        'status' => 'active'
    ],
    [
        'adminId' => 'RADM-CENTRAL',
        'name' => 'Central Region Admin',
        'email' => 'central@slt.lk',
        'password' => 'Central@123',
        'phone' => '0112345002',
        'role' => 'region_admin',
        'region' => 'Central',
        'rtom' => null,
        'status' => 'active'
    ],
    [
        'adminId' => 'RADM-SOUTHERN',
        'name' => 'Southern Region Admin',
        'email' => 'southern@slt.lk',
        'password' => 'Southern@123',
        'phone' => '0112345003',
        'role' => 'region_admin',
        'region' => 'Southern',
        'rtom' => null,
        'status' => 'active'
    ]
];

foreach ($regionalAdmins as $adminData) {
    Admin::updateOrCreate(
        ['email' => $adminData['email']],
        $adminData
    );
    echo "   {$adminData['name']}\n";
}
echo "\n";

// ==========================================
// RTOM ADMINS
// ==========================================
echo "Creating RTOM Admins...\n";

$rtomAdmins = [
    // Western Region RTOMs
    [
        'adminId' => 'RTOM-COLOMBO',
        'name' => 'Colombo RTOM Admin',
        'email' => 'admin.colombo@slt.lk',
        'password' => 'Admin@123',
        'phone' => '0771111111',
        'role' => 'rtom_admin',
        'region' => 'Western',
        'rtom' => 'Colombo',
        'status' => 'active'
    ],
    [
        'adminId' => 'RTOM-NEGOMBO',
        'name' => 'Negombo RTOM Admin',
        'email' => 'admin.negombo@slt.lk',
        'password' => 'Admin@123',
        'phone' => '0773333333',
        'role' => 'rtom_admin',
        'region' => 'Western',
        'rtom' => 'Negombo',
        'status' => 'active'
    ],
    [
        'adminId' => 'RTOM-KALUTARA',
        'name' => 'Kalutara RTOM Admin',
        'email' => 'admin.kalutara@slt.lk',
        'password' => 'Admin@123',
        'phone' => '0775555555',
        'role' => 'rtom_admin',
        'region' => 'Western',
        'rtom' => 'Kalutara',
        'status' => 'active'
    ],
    // Central Region RTOMs
    [
        'adminId' => 'RTOM-KANDY',
        'name' => 'Kandy RTOM Admin',
        'email' => 'admin.kandy@slt.lk',
        'password' => 'Admin@123',
        'phone' => '0774444444',
        'role' => 'rtom_admin',
        'region' => 'Central',
        'rtom' => 'Kandy',
        'status' => 'active'
    ],
    // Southern Region RTOMs
    [
        'adminId' => 'RTOM-MATARA',
        'name' => 'Matara RTOM Admin',
        'email' => 'admin.matara@slt.lk',
        'password' => 'Admin@123',
        'phone' => '0772222222',
        'role' => 'rtom_admin',
        'region' => 'Southern',
        'rtom' => 'Matara',
        'status' => 'active'
    ]
];

foreach ($rtomAdmins as $adminData) {
    Admin::updateOrCreate(
        ['email' => $adminData['email']],
        $adminData
    );
    echo "  ✅ {$adminData['name']} ({$adminData['rtom']})\n";
}
echo "\n";

// ==========================================
// SUPERVISORS
// ==========================================
echo "Creating Supervisors...\n";

$supervisors = [
    // Gampaha (GP) Supervisors - Western Region
    [
        'adminId' => 'SUP-GP-001',
        'name' => 'Gampaha Supervisor 1',
        'email' => 'sup.gampaha1@slt.lk',
        'password' => 'Supervisor@123',
        'phone' => '0771111001',
        'role' => 'supervisor',
        'region' => 'Western',
        'rtom' => 'GP',
        'status' => 'active'
    ],
    [
        'adminId' => 'SUP-GP-002',
        'name' => 'Gampaha Supervisor 2',
        'email' => 'sup.gampaha2@slt.lk',
        'password' => 'Supervisor@123',
        'phone' => '0771111002',
        'role' => 'supervisor',
        'region' => 'Western',
        'rtom' => 'GP',
        'status' => 'active'
    ],
    // Matara (MD) Supervisors - Southern Region
    [
        'adminId' => 'SUP-MD-001',
        'name' => 'Matara Supervisor 1',
        'email' => 'sup.matara1@slt.lk',
        'password' => 'Supervisor@123',
        'phone' => '0772222001',
        'role' => 'supervisor',
        'region' => 'Southern',
        'rtom' => 'MT',
        'status' => 'active'
    ],
    [
        'adminId' => 'SUP-MD-002',
        'name' => 'Matara Supervisor 2',
        'email' => 'sup.matara2@slt.lk',
        'password' => 'Supervisor@123',
        'phone' => '0772222002',
        'role' => 'supervisor',
        'region' => 'Southern',
        'rtom' => 'MT',
        'status' => 'active'
    ],
    // Colombo Supervisors - Western Region
    [
        'adminId' => 'SUP-COL-001',
        'name' => 'Colombo Supervisor 1',
        'email' => 'sup.colombo1@slt.lk',
        'password' => 'Supervisor@123',
        'phone' => '0773333001',
        'role' => 'supervisor',
        'region' => 'Western',
        'rtom' => 'CO',
        'status' => 'active'
    ],
    [
        'adminId' => 'SUP-COL-002',
        'name' => 'Colombo Supervisor 2',
        'email' => 'sup.colombo2@slt.lk',
        'password' => 'Supervisor@123',
        'phone' => '0773333002',
        'role' => 'supervisor',
        'region' => 'Western',
        'rtom' => 'CO',
        'status' => 'active'
    ]
];

foreach ($supervisors as $supervisorData) {
    Admin::updateOrCreate(
        ['email' => $supervisorData['email']],
        $supervisorData
    );
    echo "   {$supervisorData['name']} ({$supervisorData['rtom']})\n";
}
echo "\n";

// ==========================================
// CALLERS
// ==========================================
echo "Creating Callers...\n";

$callers = [
    [
        'callerId' => 'caller001',
        'name' => 'John Smith',
        'email' => 'john.smith@example.com',
        'password' => 'password123',
        'phone' => '0771234567',
        'maxLoad' => 20,
        'currentLoad' => 0,
        'status' => 'active',
        'taskStatus' => 'available',
        'rtom' => 'KA',  
        'region' => 'Central',
        'created_by' => 1
    ],
    [
        'callerId' => 'caller002',
        'name' => 'Sarah Johnson',
        'email' => 'sarah.johnson@example.com',
        'password' => 'password123',
        'phone' => '0772345678',
        'maxLoad' => 20,
        'currentLoad' => 0,
        'status' => 'active',
        'taskStatus' => 'available',
        'rtom' => 'KA',  
        'region' => 'Central',
        'created_by' => 1
    ],
    [
        'callerId' => 'caller003',
        'name' => 'Mike Williams',
        'email' => 'mike.williams@example.com',
        'password' => 'password123',
        'phone' => '0773456789',
        'maxLoad' => 20,
        'currentLoad' => 0,
        'status' => 'active',
        'taskStatus' => 'available',
        'rtom' => 'KA',  
        'region' => 'Central',
        'created_by' => 1
    ]
];

foreach ($callers as $callerData) {
    Caller::updateOrCreate(
        ['email' => $callerData['email']],
        $callerData
    );
    echo "  ✅ {$callerData['name']} ({$callerData['callerId']})\n";
}
echo "\n";

// ==========================================
// SUMMARY & CREDENTIALS
// ==========================================
echo str_repeat("=", 70) . "\n";
echo "SETUP COMPLETE - ALL ACCOUNTS CREATED\n";
echo str_repeat("=", 70) . "\n\n";

echo "📋 CREDENTIALS SUMMARY\n";
echo str_repeat("-", 70) . "\n\n";

echo "🔐 SUPERADMIN:\n";
echo "   Email: superadmin@slt.lk\n";
echo "   Password: Super@123\n";
echo "   Access: Full system access\n\n";

echo "📤 UPLOADER:\n";
echo "   Email: uploader@slt.lk\n";
echo "   Password: Upload@123\n";
echo "   Access: Data upload only\n\n";

echo "🌍 REGIONAL ADMINS:\n";
echo "   Western Region: western@slt.lk / Western@123\n";
echo "   Central Region: central@slt.lk / Central@123\n";
echo "   Southern Region: southern@slt.lk / Southern@123\n\n";

echo "🏢 RTOM ADMINS (Password: Admin@123 for all):\n";
echo "   Colombo: admin.colombo@slt.lk (Western)\n";
echo "   Negombo: admin.negombo@slt.lk (Western)\n";
echo "   Kalutara: admin.kalutara@slt.lk (Western)\n";
echo "   Kandy: admin.kandy@slt.lk (Central)\n";
echo "   Matara: admin.matara@slt.lk (Southern)\n\n";

echo "📞 CALLERS (Password: password123 for all):\n";
echo "   caller001: john.smith@example.com (Kandy)\n";
echo "   caller002: sarah.johnson@example.com (Kandy)\n";
echo "   caller003: mike.williams@example.com (Kandy)\n\n";

echo "👔 SUPERVISORS (Password: Supervisor@123 for all):\n";
echo "   Gampaha: sup.gampaha1@slt.lk, sup.gampaha2@slt.lk\n";
echo "   Matara: sup.matara1@slt.lk, sup.matara2@slt.lk\n";
echo "   Colombo: sup.colombo1@slt.lk, sup.colombo2@slt.lk\n\n";

echo str_repeat("=", 70) . "\n";
echo "Total Accounts Created:\n";
echo "  - 1 Superadmin\n";
echo "  - 1 Uploader\n";
echo "  - " . count($regionalAdmins) . " Regional Admins\n";
echo "  - " . count($rtomAdmins) . " RTOM Admins\n";
echo "  - " . count($supervisors) . " Supervisors\n";
echo "  - " . count($callers) . " Callers\n";
echo "  TOTAL: " . (1 + 1 + count($regionalAdmins) + count($rtomAdmins) + count($supervisors) + count($callers)) . " accounts\n";
echo str_repeat("=", 70) . "\n\n";

echo "⚠️  IMPORTANT SECURITY NOTES:\n";
echo "  1. Change all default passwords after first login\n";
echo "  2. All passwords are hashed using bcrypt\n";
echo "  3. Select correct user type (Admin/Caller) during login\n\n";

echo "✅ Setup complete! You can now log in to the system.\n";
