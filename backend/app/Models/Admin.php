<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\HasApiTokens;

class Admin extends Authenticatable
{
    use HasApiTokens;
    protected $fillable = [
        'name',
        'email',
        'password',
        'adminId',
        'phone',
        'role',
        'rtom',
        'status'
    ];

    protected $hidden = [
        'password'
    ];

    protected $casts = [
        'status' => 'string',
        'role' => 'string',
        'rtom' => 'string'
    ];

    // Automatically hash password when setting
    public function setPasswordAttribute($value)
    {
        $this->attributes['password'] = Hash::make($value);
    }

    // Relationship: Admin creates callers
    public function callers()
    {
        return $this->hasMany(Caller::class, 'created_by');
    }

    // Check if superadmin
    public function isSuperAdmin()
    {
        return $this->role === 'superadmin';
    }

    // Check if admin
    public function isAdmin()
    {
        return $this->role === 'admin';
    }

    // Check if uploader
    public function isUploader()
    {
        return $this->role === 'uploader';
    }
}
