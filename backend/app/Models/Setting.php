<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Setting extends Model
{
    protected $fillable = [
        'user_id',
        'user_type',
        'avatar',
        'email_notifications',
        'payment_reminder',
        'call_notifications',
        'language',
        'timezone',
    ];

    protected $casts = [
        'email_notifications' => 'boolean',
        'payment_reminder' => 'boolean',
        'call_notifications' => 'boolean',
    ];

    /**
     * Get the admin that owns the setting
     */
    public function admin(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'user_id');
    }

    /**
     * Get the caller that owns the setting
     */
    public function caller(): BelongsTo
    {
        return $this->belongsTo(Caller::class, 'user_id');
    }

    /**
     * Get the user (admin or caller) that owns the setting
     */
    public function user()
    {
        if ($this->user_type === 'admin') {
            return $this->admin;
        }
        return $this->caller;
    }
}
