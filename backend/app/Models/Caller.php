<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\HasApiTokens;
use App\Observers\CallerObserver;

class Caller extends Authenticatable
{
    use HasApiTokens;

    protected static function booted(): void
    {
        static::observe(CallerObserver::class);
    }
    protected $fillable = [
        'name',
        'email',
        'password',
        'callerId',
        'phone',
        'maxLoad',
        'currentLoad',
        'status',
        'taskStatus',
        'region',
        'rtom',
        'assignment_type',
        'created_by'
    ];

    protected $hidden = [
        'password'
    ];

    protected $casts = [
        'maxLoad' => 'integer',
        'currentLoad' => 'integer',
        'status' => 'string',
        'taskStatus' => 'string',
        'region' => 'string',
        'rtom' => 'string'
    ];

    // Automatically hash password
    public function setPasswordAttribute($value)
    {
        $this->attributes['password'] = Hash::make($value);
    }

    // Relationship: Caller created by admin
    public function creator()
    {
        return $this->belongsTo(Admin::class, 'created_by');
    }

    // Relationship: Caller has one setting
    public function setting(): HasOne
    {
        return $this->hasOne(Setting::class, 'user_id')->where('user_type', 'caller');
    }

    // Relationship: Caller has many customers
    public function customers()
    {
        return $this->hasMany(FilteredCustomer::class, 'assigned_to');
    }

    // Relationship: Caller has many requests
    public function requests()
    {
        return $this->hasMany(Request::class, 'caller_id');
    }

    // Get active requests
    public function activeRequests()
    {
        return $this->requests()->where('status', 'ACCEPTED');
    }
}
