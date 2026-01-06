<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $fillable = [
        'user_type',
        'user_id',
        'user_email',
        'action',
        'model',
        'model_id',
        'description',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent',
        'url',
        'method'
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Get the user that performed the action
     */
    public function user()
    {
        if ($this->user_type === 'admin') {
            return $this->belongsTo(\App\Models\Admin::class, 'user_id');
        } elseif ($this->user_type === 'caller') {
            return $this->belongsTo(\App\Models\Caller::class, 'user_id');
        }
        return null;
    }

    /**
     * Scope to filter by action
     */
    public function scopeAction($query, $action)
    {
        return $query->where('action', $action);
    }

    /**
     * Scope to filter by user
     */
    public function scopeByUser($query, $userType, $userId)
    {
        return $query->where('user_type', $userType)
            ->where('user_id', $userId);
    }

    /**
     * Scope to get recent logs
     */
    public function scopeRecent($query, $days = 7)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }
}
