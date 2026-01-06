<?php

/**
 * Password Verification Test
 * Tests that bcrypt hashed passwords can be verified correctly
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Admin;
use App\Models\Caller;
use Illuminate\Support\Facades\Hash;

echo "========================================\n";
echo "  PASSWORD VERIFICATION TEST\n";
echo "========================================\n\n";

$allPassed = true;

// Test 1: Verify Superadmin Password
echo "Test 1: Superadmin Password\n";
echo "----------------------------\n";
$superadmin = Admin::where('email', 'superadmin@slt.lk')->first();
if ($superadmin) {
    if (Hash::check('Super@123', $superadmin->password)) {
        echo "✅ PASS: Superadmin password verified\n";
    } else {
        echo "❌ FAIL: Superadmin password verification failed\n";
        $allPassed = false;
    }
} else {
    echo "⚠️  WARNING: Superadmin account not found\n";
    $allPassed = false;
}
echo "\n";

// Test 2: Verify Uploader Password
echo "Test 2: Uploader Password\n";
echo "-------------------------\n";
$uploader = Admin::where('email', 'uploader@slt.lk')->first();
if ($uploader) {
    if (Hash::check('Upload@123', $uploader->password)) {
        echo "✅ PASS: Uploader password verified\n";
    } else {
        echo "❌ FAIL: Uploader password verification failed\n";
        $allPassed = false;
    }
} else {
    echo "⚠️  WARNING: Uploader account not found\n";
    $allPassed = false;
}
echo "\n";

// Test 3: Verify Regional Admin Password
echo "Test 3: Regional Admin Password\n";
echo "--------------------------------\n";
$regionalAdmin = Admin::where('email', 'western@slt.lk')->first();
if ($regionalAdmin) {
    if (Hash::check('Western@123', $regionalAdmin->password)) {
        echo "✅ PASS: Western Regional Admin password verified\n";
    } else {
        echo "❌ FAIL: Western Regional Admin password verification failed\n";
        $allPassed = false;
    }
} else {
    echo "⚠️  WARNING: Western Regional Admin not found\n";
    $allPassed = false;
}
echo "\n";

// Test 4: Verify RTOM Admin Password
echo "Test 4: RTOM Admin Password\n";
echo "---------------------------\n";
$rtomAdmin = Admin::where('email', 'admin.colombo@slt.lk')->first();
if ($rtomAdmin) {
    if (Hash::check('Admin@123', $rtomAdmin->password)) {
        echo "✅ PASS: Colombo RTOM Admin password verified\n";
    } else {
        echo "❌ FAIL: Colombo RTOM Admin password verification failed\n";
        $allPassed = false;
    }
} else {
    echo "⚠️  WARNING: Colombo RTOM Admin not found\n";
    $allPassed = false;
}
echo "\n";

// Test 5: Verify Caller Password
echo "Test 5: Caller Password\n";
echo "-----------------------\n";
$caller = Caller::where('email', 'john.smith@example.com')->first();
if ($caller) {
    if (Hash::check('password123', $caller->password)) {
        echo "✅ PASS: Caller password verified\n";
    } else {
        echo "❌ FAIL: Caller password verification failed\n";
        $allPassed = false;
    }
} else {
    echo "⚠️  WARNING: Caller account not found\n";
    $allPassed = false;
}
echo "\n";

// Test 6: Test bcrypt() vs Hash::make() equivalence
echo "Test 6: bcrypt() vs Hash::make() Equivalence\n";
echo "---------------------------------------------\n";
$testPassword = 'TestPassword123';
$bcryptHash = bcrypt($testPassword);
$hashMakeHash = Hash::make($testPassword);

if (Hash::check($testPassword, $bcryptHash) && Hash::check($testPassword, $hashMakeHash)) {
    echo "✅ PASS: Both bcrypt() and Hash::make() produce verifiable hashes\n";
} else {
    echo "❌ FAIL: Hash verification failed\n";
    $allPassed = false;
}
echo "\n";

// Test 7: Test Model Mutator
echo "Test 7: Model Mutator Password Hashing\n";
echo "---------------------------------------\n";
$testAdmin = new Admin();
$testAdmin->password = 'MutatorTest123';
if (Hash::check('MutatorTest123', $testAdmin->password)) {
    echo "✅ PASS: Admin model mutator correctly hashes passwords\n";
} else {
    echo "❌ FAIL: Admin model mutator failed\n";
    $allPassed = false;
}

$testCaller = new Caller();
$testCaller->password = 'MutatorTest123';
if (Hash::check('MutatorTest123', $testCaller->password)) {
    echo "✅ PASS: Caller model mutator correctly hashes passwords\n";
} else {
    echo "❌ FAIL: Caller model mutator failed\n";
    $allPassed = false;
}
echo "\n";

// Final Summary
echo "========================================\n";
if ($allPassed) {
    echo "✅ ALL TESTS PASSED!\n";
    echo "========================================\n";
    echo "All passwords are correctly hashed and can be verified.\n";
    echo "You can now log in with any of the created accounts.\n";
} else {
    echo "❌ SOME TESTS FAILED\n";
    echo "========================================\n";
    echo "Please check the errors above.\n";
    echo "You may need to run: php all-accounts.php\n";
}
echo "\n";
