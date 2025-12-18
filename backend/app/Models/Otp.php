<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Otp extends Model
{
    protected $fillable = [
        'email',
        'otp',
        'user_type',
        'is_verified',
        'expires_at'
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'is_verified' => 'boolean'
    ];

    /**
     * Generate a random 6-digit OTP
     */
    public static function generateOtp(): string
    {
        return str_pad((string)random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
    }

    /**
     * Check if OTP is expired
     */
    public function isExpired(): bool
    {
        return Carbon::now()->isAfter($this->expires_at);
    }

    /**
     * Check if OTP is valid
     */
    public function isValid(string $otp): bool
    {
        return !$this->is_verified 
            && !$this->isExpired() 
            && $this->otp === $otp;
    }
}
