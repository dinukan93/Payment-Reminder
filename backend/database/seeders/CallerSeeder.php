<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Caller;
use Illuminate\Support\Facades\Hash;

class CallerSeeder extends Seeder
{
    public function run()
    {
        // Create caller 1
        Caller::create([
            'callerId' => 'caller001',
            'name' => 'John Smith',
            'email' => 'john.smith@example.com',
            'phone' => '0771234567',
            'password' => bcrypt('password123'),
            'maxLoad' => 20,
            'currentLoad' => 0,
            'status' => 'active',
            'taskStatus' => 'available',
            'rtom' => 'Kandy',
            'created_by' => 1
        ]);

        // Create caller 2
        Caller::create([
            'callerId' => 'caller002',
            'name' => 'Sarah Johnson',
            'email' => 'sarah.johnson@example.com',
            'phone' => '0772345678',
            'password' => bcrypt('password123'),
            'maxLoad' => 20,
            'currentLoad' => 0,
            'status' => 'active',
            'taskStatus' => 'available',
            'rtom' => 'Kandy',
            'created_by' => 1
        ]);

        // Create caller 3
        Caller::create([
            'callerId' => 'caller003',
            'name' => 'Mike Williams',
            'email' => 'mike.williams@example.com',
            'phone' => '0773456789',
            'password' => bcrypt('password123'),
            'maxLoad' => 20,
            'currentLoad' => 0,
            'status' => 'active',
            'taskStatus' => 'available',
            'rtom' => 'Kandy',
            'created_by' => 1
        ]);

        echo "✓ Created 3 callers in RTOM Kandy\n";
    }
}
