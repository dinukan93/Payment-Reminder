<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\HasApiTokens;
use App\Observers\AdminObserver;

class Admin extends Authenticatable
{
    use HasApiTokens;

    protected static function booted(): void
    {
        static::observe(AdminObserver::class);
    }
    protected $fillable = [
        'name',
        'email',
        'password',
        'adminId',
        'phone',
        'role',
        'region',
        'rtom',
        'assignment_type',
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

    // Relationship: Admin has one setting
    public function setting(): HasOne
    {
        return $this->hasOne(Setting::class, 'user_id')->where('user_type', 'admin');
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
            $regionQuery = $query->where('REGION', $this->region);
            // If region admin has assignment_type, filter by it
            if ($this->assignment_type) {
                $regionQuery->where('assignment_type', $this->assignment_type);
            }
            return $regionQuery;
        } elseif ($this->isRtomAdmin() && $this->rtom) {
            // RTOM admin can see only customers in their RTOM
            $rtomQuery = $query->where('RTOM', $this->rtom);
            // If RTOM admin has assignment_type, filter by it
            if ($this->assignment_type) {
                $rtomQuery->where('assignment_type', $this->assignment_type);
            }
            return $rtomQuery;
        } elseif ($this->isSupervisor() && $this->rtom) {
            // Supervisor can see customers in their RTOM
            $supervisorQuery = $query->where('RTOM', $this->rtom);
            // If supervisor has assignment_type, filter by it
            if ($this->assignment_type) {
                $supervisorQuery->where('assignment_type', $this->assignment_type);
            }
            return $supervisorQuery;
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
