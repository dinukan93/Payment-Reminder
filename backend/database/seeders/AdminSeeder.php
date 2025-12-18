<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Admin;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        // Create Superadmin
        $superadmin = Admin::updateOrCreate(
            ['email' => 'superadmin@slt.lk'],
            [
                'adminId' => 'SUPERADMIN001',
                'name' => 'Super Administrator',
                'phone' => '0771234567',
                'password' => Hash::make('Super@123'),
                'role' => 'superadmin',
                'rtom' => null,
                'status' => 'active'
            ]
        );

        $this->command->info('✅ Superadmin created: superadmin@slt.lk / Super@123');

        // Create Admin users for each RTOM
        $admins = [
            [
                'adminId' => 'ADMIN001',
                'name' => 'Colombo Admin',
                'email' => 'admin.colombo@slt.lk',
                'phone' => '0771111111',
                'password' => Hash::make('Admin@123'),
                'role' => 'admin',
                'rtom' => 'Colombo',
                'status' => 'active'
            ],
            [
                'adminId' => 'ADMIN002',
                'name' => 'Matara Admin',
                'email' => 'admin.matara@slt.lk',
                'phone' => '0772222222',
                'password' => Hash::make('Admin@123'),
                'role' => 'admin',
                'rtom' => 'Matara',
                'status' => 'active'
            ],
            [
                'adminId' => 'ADMIN003',
                'name' => 'Negombo Admin',
                'email' => 'admin.negombo@slt.lk',
                'phone' => '0773333333',
                'password' => Hash::make('Admin@123'),
                'role' => 'admin',
                'rtom' => 'Negombo',
                'status' => 'active'
            ],
            [
                'adminId' => 'ADMIN004',
                'name' => 'Kandy Admin',
                'email' => 'admin.kandy@slt.lk',
                'phone' => '0774444444',
                'password' => Hash::make('Admin@123'),
                'role' => 'admin',
                'rtom' => 'Kandy',
                'status' => 'active'
            ],
            [
                'adminId' => 'ADMIN005',
                'name' => 'Kalutara Admin',
                'email' => 'admin.kalutara@slt.lk',
                'phone' => '0775555555',
                'password' => Hash::make('Admin@123'),
                'role' => 'admin',
                'rtom' => 'Kalutara',
                'status' => 'active'
            ]
        ];

        foreach ($admins as $adminData) {
            Admin::updateOrCreate(
                ['email' => $adminData['email']],
                $adminData
            );
            $this->command->info("✅ Admin created: {$adminData['email']} ({$adminData['rtom']})");
        }

        // Create Uploader
        $uploader = Admin::updateOrCreate(
            ['email' => 'uploader@slt.lk'],
            [
                'adminId' => 'UPLOADER001',
                'name' => 'Data Uploader',
                'phone' => '0779999999',
                'password' => Hash::make('Upload@123'),
                'role' => 'uploader',
                'rtom' => null,
                'status' => 'active'
            ]
        );

        $this->command->info('✅ Uploader created: uploader@slt.lk / Upload@123');
        
        $this->command->warn('⚠️  IMPORTANT: Change default passwords after first login!');
    }
}
