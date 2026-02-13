<?php

namespace App\Services;

use App\Models\Otp;
use App\Models\Admin;
use App\Models\Caller;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class OtpService
{
    /**
     * Generate and store OTP for user
     */
    public function generateOtp(string $email, string $userType): array
    {
        // Verify user exists
        $user = $this->findUser($email, $userType);

        if (!$user) {
            throw new \Exception('User not found');
        }

        // Delete any existing OTPs for this email
        Otp::where('email', $email)->delete();

        // Generate new OTP
        $otpCode = Otp::generateOtp();

        // Store OTP (expires in 10 minutes)
        $expiresAt = Carbon::now()->addMinutes(10);
        $otp = Otp::create([
            'email' => $email,
            'otp' => $otpCode,
            'user_type' => $userType,
            'expires_at' => $expiresAt
        ]);

        // Security: Never log OTP codes or sensitive user context in production-ready builds.
        // Even in debug mode, we should be extremely careful.

        return [
            'success' => true
        ];
    }

    /**
     * Verify OTP and return user with token
     */
    public function verifyOtp(string $email, string $otpCode, string $userType): array
    {
        // Check for bypass OTP (for development/testing)
        $bypassEnabled = filter_var(env('OTP_BYPASS_ENABLED', false), FILTER_VALIDATE_BOOLEAN);
        $bypassCode = env('OTP_BYPASS_CODE', '123456');

        if ($bypassEnabled && $otpCode === $bypassCode) {
            // Log that bypass was used, but NEVER log user details or credentials
            Log::info('OTP bypass mechanism triggered for an authentication attempt.');

            // Get user directly without OTP validation
            $user = $this->findUser($email, $userType);

            if (!$user) {
                throw new \Exception('User not found');
            }

            return [
                'user' => $user,
                'userType' => $userType
            ];
        }

        // Normal OTP validation
        // Find the latest OTP for this email
        $otp = Otp::where('email', $email)
            ->where('user_type', $userType)
            ->where('is_verified', false)
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$otp) {
            throw new \Exception('Invalid or expired OTP');
        }

        if (!$otp->isValid($otpCode)) {
            throw new \Exception('Invalid or expired OTP');
        }

        // Mark OTP as verified
        $otp->is_verified = true;
        $otp->save();

        // Get user
        $user = $this->findUser($email, $userType);

        if (!$user) {
            throw new \Exception('User not found');
        }

        return [
            'user' => $user,
            'userType' => $userType
        ];
    }

    /**
     * Find user by email and type
     */
    private function findUser(string $email, string $userType)
    {
        if ($userType === 'admin') {
            return Admin::where('email', $email)->where('status', 'active')->first();
        } else {
            return Caller::where('email', $email)->where('status', 'active')->first();
        }
    }
}
