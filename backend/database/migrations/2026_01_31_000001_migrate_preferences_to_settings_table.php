<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use App\Models\Admin;
use App\Models\Caller;
use App\Models\Setting;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Step 1: Migrate existing preferences from admins table to settings table
        $admins = Admin::all();
        foreach ($admins as $admin) {
            // Check if settings record already exists
            $existingSetting = Setting::where('user_id', $admin->id)
                ->where('user_type', 'admin')
                ->first();

            if (!$existingSetting) {
                // Create settings record with preferences from admin table
                Setting::create([
                    'user_id' => $admin->id,
                    'user_type' => 'admin',
                    'avatar' => $admin->avatar,
                    'email_notifications' => $admin->email_notifications ?? false,
                    'payment_reminder' => $admin->payment_reminder ?? false,
                    'call_notifications' => $admin->call_notifications ?? false,
                    'language' => $admin->language ?? 'English',
                    'timezone' => $admin->timezone ?? 'UTC',
                ]);
            } else {
                // Update existing settings if columns have data and settings don't
                if (
                    ($admin->avatar && !$existingSetting->avatar) ||
                    ($admin->email_notifications && !$existingSetting->email_notifications) ||
                    ($admin->payment_reminder && !$existingSetting->payment_reminder) ||
                    ($admin->call_notifications && !$existingSetting->call_notifications)
                ) {
                    $existingSetting->update([
                        'avatar' => $admin->avatar ?? $existingSetting->avatar,
                        'email_notifications' => $admin->email_notifications ?? $existingSetting->email_notifications,
                        'payment_reminder' => $admin->payment_reminder ?? $existingSetting->payment_reminder,
                        'call_notifications' => $admin->call_notifications ?? $existingSetting->call_notifications,
                        'language' => $admin->language ?? $existingSetting->language,
                        'timezone' => $admin->timezone ?? $existingSetting->timezone,
                    ]);
                }
            }
        }

        // Step 2: Migrate existing preferences from callers table to settings table
        $callers = Caller::all();
        foreach ($callers as $caller) {
            // Check if settings record already exists
            $existingSetting = Setting::where('user_id', $caller->id)
                ->where('user_type', 'caller')
                ->first();

            if (!$existingSetting) {
                // Create settings record with preferences from caller table
                Setting::create([
                    'user_id' => $caller->id,
                    'user_type' => 'caller',
                    'avatar' => $caller->avatar,
                    'email_notifications' => $caller->email_notifications ?? false,
                    'payment_reminder' => $caller->payment_reminder ?? false,
                    'call_notifications' => $caller->call_notifications ?? false,
                    'language' => $caller->language ?? 'English',
                    'timezone' => $caller->timezone ?? 'UTC',
                ]);
            } else {
                // Update existing settings if columns have data and settings don't
                if (
                    ($caller->avatar && !$existingSetting->avatar) ||
                    ($caller->email_notifications && !$existingSetting->email_notifications) ||
                    ($caller->payment_reminder && !$existingSetting->payment_reminder) ||
                    ($caller->call_notifications && !$existingSetting->call_notifications)
                ) {
                    $existingSetting->update([
                        'avatar' => $caller->avatar ?? $existingSetting->avatar,
                        'email_notifications' => $caller->email_notifications ?? $existingSetting->email_notifications,
                        'payment_reminder' => $caller->payment_reminder ?? $existingSetting->payment_reminder,
                        'call_notifications' => $caller->call_notifications ?? $existingSetting->call_notifications,
                        'language' => $caller->language ?? $existingSetting->language,
                        'timezone' => $caller->timezone ?? $existingSetting->timezone,
                    ]);
                }
            }
        }

        // Step 3: Drop redundant columns from admins table
        Schema::table('admins', function (Blueprint $table) {
            $table->dropColumn([
                'avatar',
                'email_notifications',
                'payment_reminder',
                'call_notifications',
                'language',
                'timezone'
            ]);
        });

        // Step 4: Drop redundant columns from callers table
        Schema::table('callers', function (Blueprint $table) {
            $table->dropColumn([
                'avatar',
                'email_notifications',
                'payment_reminder',
                'call_notifications',
                'language',
                'timezone'
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Add columns back to admins table
        Schema::table('admins', function (Blueprint $table) {
            $table->longText('avatar')->nullable()->after('status');
            $table->boolean('email_notifications')->default(false)->after('avatar');
            $table->boolean('payment_reminder')->default(false)->after('email_notifications');
            $table->boolean('call_notifications')->default(false)->after('payment_reminder');
            $table->string('language')->default('English')->after('call_notifications');
            $table->string('timezone')->default('UTC')->after('language');
        });

        // Add columns back to callers table
        Schema::table('callers', function (Blueprint $table) {
            $table->longText('avatar')->nullable()->after('created_by');
            $table->boolean('email_notifications')->default(false)->after('avatar');
            $table->boolean('payment_reminder')->default(false)->after('email_notifications');
            $table->boolean('call_notifications')->default(false)->after('payment_reminder');
            $table->string('language')->default('English')->after('call_notifications');
            $table->string('timezone')->default('UTC')->after('language');
        });

        // Migrate data back from settings table to admins and callers
        $admins = Admin::all();
        foreach ($admins as $admin) {
            $setting = Setting::where('user_id', $admin->id)
                ->where('user_type', 'admin')
                ->first();

            if ($setting) {
                $admin->update([
                    'avatar' => $setting->avatar,
                    'email_notifications' => $setting->email_notifications,
                    'payment_reminder' => $setting->payment_reminder,
                    'call_notifications' => $setting->call_notifications,
                    'language' => $setting->language,
                    'timezone' => $setting->timezone,
                ]);
            }
        }

        $callers = Caller::all();
        foreach ($callers as $caller) {
            $setting = Setting::where('user_id', $caller->id)
                ->where('user_type', 'caller')
                ->first();

            if ($setting) {
                $caller->update([
                    'avatar' => $setting->avatar,
                    'email_notifications' => $setting->email_notifications,
                    'payment_reminder' => $setting->payment_reminder,
                    'call_notifications' => $setting->call_notifications,
                    'language' => $setting->language,
                    'timezone' => $setting->timezone,
                ]);
            }
        }
    }
};
