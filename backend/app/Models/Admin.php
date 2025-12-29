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
        'region',
        'rtom',
        'status',
        'avatar',
        'email_notifications',
        'payment_reminder',
        'call_notifications',
        'language',
        'timezone'
    ];

    protected $hidden = [
        'password'
    ];

    protected $casts = [
        'status' => 'string',
        'role' => 'string',
        'region' => 'string',
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

    // Check if region admin
    public function isRegionAdmin()
    {
        return $this->role === 'region_admin';
    }

    // Check if rtom admin
    public function isRtomAdmin()
    {
        return $this->role === 'rtom_admin';
    }

    // Check if supervisor
    public function isSupervisor()
    {
        return $this->role === 'supervisor';
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

    // Get customers based on admin's role and region/rtom
    public function getAccessibleCustomers()
    {
        $query = \App\Models\FilteredCustomer::query();

        if ($this->isSuperAdmin()) {
            // Superadmin can see all customers
            return $query;
        } elseif ($this->isRegionAdmin() && $this->region) {
            // Region admin can see all customers in their region
            return $query->where('REGION', $this->region);
        } elseif ($this->isRtomAdmin() && $this->rtom) {
            // RTOM admin can see only customers in their RTOM
            return $query->where('RTOM', $this->rtom);
        } elseif ($this->isSupervisor() && $this->rtom) {
            // Supervisor can see customers in their RTOM
            return $query->where('RTOM', $this->rtom);
        }

        // Default: no access
        return $query->where('id', 0);
    }

    // Check if admin has access to a specific region
    public function hasRegionAccess($region)
    {
        if ($this->isSuperAdmin()) {
            return true;
        }
        if ($this->isRegionAdmin()) {
            return $this->region === $region;
        }
        return false;
    }

    // Check if admin has access to a specific RTOM
    public function hasRtomAccess($rtom)
    {
        if ($this->isSuperAdmin()) {
            return true;
        }
        if ($this->isRegionAdmin() || $this->isRtomAdmin() || $this->isSupervisor()) {
            return $this->rtom === $rtom;
        }
        return false;
    }
}
