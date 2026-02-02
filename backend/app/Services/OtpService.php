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

        Log::info("OTP GENERATED", [
            'email' => $email,
            'user_type' => $userType,
            'otp_code' => $otpCode,
            'expires_at' => $expiresAt->format('Y-m-d H:i:s')
        ]);

        if (config('app.debug')) {
            // Log to error log (visible in terminal)
            error_log("");
            error_log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            error_log(" OTP GENERATED");
            error_log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            error_log(" Email: {$email}");
            error_log(" User Type: {$userType}");
            error_log(" OTP Code: {$otpCode}");
            error_log(" Expires: {$expiresAt->format('Y-m-d H:i:s')}");
            error_log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            error_log("");
        }

        return [
            'success' => true,
            'message' => 'OTP sent successfully',
            'otp' => config('app.debug') ? $otpCode : null
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
            Log::info('OTP BYPASS USED', [
                'email' => $email,
                'user_type' => $userType
            ]);

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
