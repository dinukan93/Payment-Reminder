<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Admin;
use App\Models\Caller;
use App\Services\OtpService;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    protected $otpService;

    public function __construct(OtpService $otpService)
    {
        $this->otpService = $otpService;
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
            'userType' => 'required|in:admin,caller'
        ]);

        // Check the appropriate table based on userType
        $userType = $request->userType;
        
        if ($userType === 'admin') {
            $user = Admin::where('email', $request->email)->first();
        } else {
            $user = Caller::where('email', $request->email)->first();
        }

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['error' => 'Invalid credentials'], 401);
        }

        if ($user->status !== 'active') {
            return response()->json(['error' => 'Account is inactive'], 403);
        }

        // Password verified - now send OTP to user's phone
        $otpResult = $this->otpService->generateOtp($request->email, $userType);

        // Return response without OTP
        $response = [
            'message' => 'Password verified. OTP sent to your phone.',
            'requiresOtp' => true
        ];

        return response()->json($response);
    }

    public function me(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'userType' => $user instanceof Admin ? 'admin' : 'caller',
                'role' => $user instanceof Admin ? $user->role : 'caller',
                'rtom' => $user->rtom
            ]
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }

    /**
     * Send OTP to user's email
     */
    public function sendOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'userType' => 'required|in:admin,caller'
        ]);

        try {
            $result = $this->otpService->generateOtp($request->email, $request->userType);
            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * Verify OTP and login
     */
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp' => 'required|string|size:6',
            'userType' => 'required|in:admin,caller'
        ]);

        try {
            $result = $this->otpService->verifyOtp($request->email, $request->otp, $request->userType);
            
            $user = $result['user'];
            $userType = $result['userType'];
            
            // Generate Sanctum token
            $token = $user->createToken('auth-token', [$userType])->plainTextToken;

            return response()->json([
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'userType' => $userType,
                    'role' => $userType === 'admin' ? $user->role : 'caller',
                    'rtom' => $user->rtom
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 401);
        }
    }
}
