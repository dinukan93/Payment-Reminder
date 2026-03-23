<?php

namespace App\Services;

use App\Models\Otp;
use App\Models\Admin;
use App\Models\Caller;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Throwable;

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
        $otpCode = trim($otpCode);

        // Check for bypass OTP (for development/testing)
        $bypassEnabled = filter_var(config('services.otp_bypass.enabled', false), FILTER_VALIDATE_BOOLEAN);
        $bypassCode = (string) config('services.otp_bypass.code', '123456');

        if ($bypassEnabled && $bypassCode !== '' && hash_equals($bypassCode, $otpCode)) {
            // Log bypass usage if possible, but never block authentication on log I/O issues.
            try {
                Log::info('OTP bypass mechanism triggered for an authentication attempt.');
            } catch (Throwable $ignored) {
                // Do not fail authentication due to logging permission/runtime issues.
            }

            $resolvedUser = $this->resolveBypassUser($email, $userType);

            return [
                'user' => $resolvedUser['user'],
                'userType' => $resolvedUser['userType']
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
     * Resolve user during bypass, allowing fallback to the other user type.
     */
    private function resolveBypassUser(string $email, string $requestedUserType): array
    {
        $requestedUser = $this->findUser($email, $requestedUserType);

        if ($requestedUser) {
            return [
                'user' => $requestedUser,
                'userType' => $requestedUserType,
            ];
        }

        $fallbackUserType = $requestedUserType === 'admin' ? 'caller' : 'admin';
        $fallbackUser = $this->findUser($email, $fallbackUserType);

        if ($fallbackUser) {
            return [
                'user' => $fallbackUser,
                'userType' => $fallbackUserType,
            ];
        }

        throw new \Exception('User not found');
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
