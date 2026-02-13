<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

/**
 * This is a placeholder User model for compatibility with Laravel's default authentication.
 * The actual authentication in this application uses Caller and Admin models.
 * 
 * This model exists to prevent errors when Laravel or packages expect a default User model.
 */
class User extends Authenticatable
{
    use HasApiTokens;

    protected $table = 'admins'; 

    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];
}
