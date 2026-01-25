<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Admin;
use App\Models\Caller;
use App\Models\Setting;

class CreateSettingsForExistingUsers extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create settings for existing admins that don't have settings
        $admins = Admin::whereDoesntHave('setting')->get();
        foreach ($admins as $admin) {
            Setting::create([
                'user_id' => $admin->id,
                'user_type' => 'admin',
                'avatar' => null,
                'email_notifications' => false,
                'payment_reminder' => false,
                'call_notifications' => false,
                'language' => 'English',
                'timezone' => 'UTC',
            ]);
        }

        // Create settings for existing callers that don't have settings
        $callers = Caller::whereDoesntHave('setting')->get();
        foreach ($callers as $caller) {
            Setting::create([
                'user_id' => $caller->id,
                'user_type' => 'caller',
                'avatar' => null,
                'email_notifications' => false,
                'payment_reminder' => false,
                'call_notifications' => false,
                'language' => 'English',
                'timezone' => 'UTC',
            ]);
        }

        $this->command->info('Settings created for all existing users!');
    }
}
