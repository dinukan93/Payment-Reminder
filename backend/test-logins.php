php test-logins.php<?php

/**
 * ========================================
 * LOGIN TEST SCRIPT
 * ========================================
 * 
 * This script tests login functionality for all accounts
 * by verifying password hashing and authentication.
 * 
 * Usage: php test-logins.php
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Admin;
use App\Models\Caller;
use Illuminate\Support\Facades\Hash;

echo "========================================\n";
echo "  LOGIN FUNCTIONALITY TEST\n";
echo "========================================\n\n";

// Test accounts with their credentials
$testAccounts = [
    // Superadmin
    [
        'type' => 'admin',
        'email' => 'superadmin@slt.lk',
        'password' => 'Super@123',
        'name' => 'Super Administrator',
        'role' => 'superadmin'
    ],
    // Uploader
    [
        'type' => 'admin',
        'email' => 'uploader@slt.lk',
        'password' => 'Upload@123',
        'name' => 'Data Uploader',
        'role' => 'uploader'
    ],
    // Regional Admins
    [
        'type' => 'admin',
        'email' => 'western@slt.lk',
        'password' => 'Western@123',
        'name' => 'Western Region Admin',
        'role' => 'region_admin'
    ],
    [
        'type' => 'admin',
        'email' => 'central@slt.lk',
        'password' => 'Central@123',
        'name' => 'Central Region Admin',
        'role' => 'region_admin'
    ],
    [
        'type' => 'admin',
        'email' => 'southern@slt.lk',
        'password' => 'Southern@123',
        'name' => 'Southern Region Admin',
        'role' => 'region_admin'
    ],
    // RTOM Admins
    [
        'type' => 'admin',
        'email' => 'admin.colombo@slt.lk',
        'password' => 'Admin@123',
        'name' => 'Colombo RTOM Admin',
        'role' => 'rtom_admin'
    ],
    [
        'type' => 'admin',
        'email' => 'admin.negombo@slt.lk',
        'password' => 'Admin@123',
        'name' => 'Negombo RTOM Admin',
        'role' => 'rtom_admin'
    ],
    [
        'type' => 'admin',
        'email' => 'admin.kalutara@slt.lk',
        'password' => 'Admin@123',
        'name' => 'Kalutara RTOM Admin',
        'role' => 'rtom_admin'
    ],
    [
        'type' => 'admin',
        'email' => 'admin.kandy@slt.lk',
        'password' => 'Admin@123',
        'name' => 'Kandy RTOM Admin',
        'role' => 'rtom_admin'
    ],
    [
        'type' => 'admin',
        'email' => 'admin.matara@slt.lk',
        'password' => 'Admin@123',
        'name' => 'Matara RTOM Admin',
        'role' => 'rtom_admin'
    ],
    // Callers
    [
        'type' => 'caller',
        'email' => 'john.smith@example.com',
        'password' => 'password123',
        'name' => 'John Smith',
        'role' => 'caller'
    ],
    [
        'type' => 'caller',
        'email' => 'sarah.johnson@example.com',
        'password' => 'password123',
        'name' => 'Sarah Johnson',
        'role' => 'caller'
    ],
    [
        'type' => 'caller',
        'email' => 'mike.williams@example.com',
        'password' => 'password123',
        'name' => 'Mike Williams',
        'role' => 'caller'
    ]
];

$totalTests = count($testAccounts);
$passedTests = 0;
$failedTests = 0;
$results = [];

echo "Testing " . $totalTests . " accounts...\n\n";
echo str_repeat("-", 80) . "\n";

foreach ($testAccounts as $account) {
    $testResult = [
        'email' => $account['email'],
        'name' => $account['name'],
        'type' => $account['type'],
        'role' => $account['role'],
        'status' => 'UNKNOWN',
        'message' => ''
    ];

    try {
        // Fetch user from appropriate table
        if ($account['type'] === 'admin') {
            $user = Admin::where('email', $account['email'])->first();
        } else {
            $user = Caller::where('email', $account['email'])->first();
        }

        // Check if user exists
        if (!$user) {
            $testResult['status'] = 'FAILED';
            $testResult['message'] = 'Account not found in database';
            $failedTests++;
        }
        // Check if account is active
        elseif ($user->status !== 'active') {
            $testResult['status'] = 'FAILED';
            $testResult['message'] = "Account status is '{$user->status}' (expected 'active')";
            $failedTests++;
        }
        // Verify password hash
        elseif (!Hash::check($account['password'], $user->password)) {
            $testResult['status'] = 'FAILED';
            $testResult['message'] = 'Password verification failed';
            $failedTests++;
        }
        // All checks passed
        else {
            $testResult['status'] = 'PASSED';
            $testResult['message'] = 'Login credentials verified successfully';
            $passedTests++;
        }
    } catch (\Exception $e) {
        $testResult['status'] = 'ERROR';
        $testResult['message'] = 'Exception: ' . $e->getMessage();
        $failedTests++;
    }

    $results[] = $testResult;

    // Display result
    $statusIcon = $testResult['status'] === 'PASSED' ? '✅' : '❌';
    $statusColor = $testResult['status'] === 'PASSED' ? "\033[32m" : "\033[31m";
    $resetColor = "\033[0m";

    echo $statusIcon . " " . $statusColor . str_pad($testResult['status'], 8) . $resetColor;
    echo " | " . str_pad($testResult['type'], 7);
    echo " | " . str_pad($testResult['role'], 15);
    echo " | " . str_pad($testResult['email'], 30);
    echo "\n";

    if ($testResult['status'] !== 'PASSED') {
        echo "   └─ " . $testResult['message'] . "\n";
    }
}

echo str_repeat("-", 80) . "\n\n";

// Summary
echo "========================================\n";
echo "  TEST SUMMARY\n";
echo "========================================\n";
echo "Total Tests:  " . $totalTests . "\n";
echo "✅ Passed:    " . $passedTests . " (" . round(($passedTests / $totalTests) * 100, 1) . "%)\n";
echo "❌ Failed:    " . $failedTests . " (" . round(($failedTests / $totalTests) * 100, 1) . "%)\n";
echo "========================================\n\n";

// Detailed failure report
if ($failedTests > 0) {
    echo "⚠️  FAILED TESTS DETAILS:\n";
    echo str_repeat("-", 80) . "\n";
    foreach ($results as $result) {
        if ($result['status'] !== 'PASSED') {
            echo "Account: {$result['name']} ({$result['email']})\n";
            echo "Type:    {$result['type']} - {$result['role']}\n";
            echo "Issue:   {$result['message']}\n";
            echo str_repeat("-", 80) . "\n";
        }
    }
    echo "\n";
}

// Exit with appropriate code
if ($failedTests > 0) {
    echo "❌ Some tests failed. Please review the issues above.\n";
    exit(1);
} else {
    echo "✅ All login tests passed successfully!\n";
    echo "   All accounts can authenticate with their credentials.\n";
    exit(0);
}
