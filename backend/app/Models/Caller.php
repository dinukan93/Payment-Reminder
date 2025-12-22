<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\HasApiTokens;

class Caller extends Authenticatable
{
    use HasApiTokens;
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
        'rtom',
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

    // Relationship: Caller has many customers
    public function customers()
    {
        return $this->hasMany(Customer::class, 'assigned_to');
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
