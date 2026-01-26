<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Caller;
use App\Models\Setting;

class CreateSettingsForExistingCallers extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all callers that don't have settings
        $callers = Caller::all();

        $count = 0;
        foreach ($callers as $caller) {
            // Check if settings already exist for this caller
            $existingSetting = Setting::where('user_id', $caller->id)
                ->where('user_type', 'caller')
                ->first();

            if (!$existingSetting) {
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
                $count++;
            }
        }

        $this->command->info("Settings created for {$count} existing callers!");
    }
}
