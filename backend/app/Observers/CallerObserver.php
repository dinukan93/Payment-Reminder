<?php

namespace App\Observers;

use App\Models\Caller;
use App\Models\Setting;

class CallerObserver
{
    /**
     * Handle the Caller "created" event.
     */
    public function created(Caller $caller): void
    {
        // Create default settings for the new caller
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

    /**
     * Handle the Caller "updated" event.
     */
    public function updated(Caller $caller): void
    {
        //
    }

    /**
     * Handle the Caller "deleted" event.
     */
    public function deleted(Caller $caller): void
    {
        // Delete associated settings when caller is deleted
        $caller->setting()->delete();
    }

    /**
     * Handle the Caller "restored" event.
     */
    public function restored(Caller $caller): void
    {
        //
    }

    /**
     * Handle the Caller "force deleted" event.
     */
    public function forceDeleted(Caller $caller): void
    {
        // Delete associated settings when caller is force deleted
        Setting::where('user_id', $caller->id)
            ->where('user_type', 'caller')
            ->delete();
    }
}
