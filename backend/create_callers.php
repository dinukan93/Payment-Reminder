use App\Models\Caller;

// Create caller 1
$caller1 = Caller::create([
'callerId' => 'caller001',
'name' => 'John Smith',
'email' => 'john.smith@example.com',
'phone' => '0771234567',
'password' => bcrypt('password123'),
'maxLoad' => 20,
'currentLoad' => 0,
'status' => 'AVAILABLE',
'rtom' => 'KA',
'region' => 'Region 1',
'created_by' => 1
]);

// Create caller 2
$caller2 = Caller::create([
'callerId' => 'caller002',
'name' => 'Sarah Johnson',
'email' => 'sarah.johnson@example.com',
'phone' => '0772345678',
'password' => bcrypt('password123'),
'maxLoad' => 20,
'currentLoad' => 0,
'status' => 'AVAILABLE',
'rtom' => 'KA',
'region' => 'Region 1',
'created_by' => 1
]);

// Create caller 3
$caller3 = Caller::create([
'callerId' => 'caller003',
'name' => 'Mike Williams',
'email' => 'mike.williams@example.com',
'phone' => '0773456789',
'password' => bcrypt('password123'),
'maxLoad' => 20,
'currentLoad' => 0,
'status' => 'AVAILABLE',
'rtom' => 'KA',
'region' => 'Region 1',
'created_by' => 1
]);

echo "Created 3 callers in RTOM KA (Kandy - Region 1)\n";
echo "Caller IDs: caller001, caller002, caller003\n";