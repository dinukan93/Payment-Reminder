<?php

namespace App\Observers;

use App\Models\Admin;
use App\Models\Setting;

class AdminObserver
{
    /**
     * Handle the Admin "created" event.
     */
    public function created(Admin $admin): void
    {
        // Create default settings for the new admin
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

    /**
     * Handle the Admin "updated" event.
     */
    public function updated(Admin $admin): void
    {
        //
    }

    /**
     * Handle the Admin "deleted" event.
     */
    public function deleted(Admin $admin): void
    {
        // Delete associated settings when admin is deleted
        $admin->setting()->delete();
    }

    /**
     * Handle the Admin "restored" event.
     */
    public function restored(Admin $admin): void
    {
        //
    }

    /**
     * Handle the Admin "force deleted" event.
     */
    public function forceDeleted(Admin $admin): void
    {
        // Delete associated settings when admin is force deleted
        Setting::where('user_id', $admin->id)
            ->where('user_type', 'admin')
            ->delete();
    }
}
