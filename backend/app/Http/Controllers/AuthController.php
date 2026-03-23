<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Admin;
use App\Models\Caller;
use App\Services\AuditLogger;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
            'userType' => 'required|in:admin,caller'
        ]);

        $userType = $request->userType;

        if ($userType === 'admin') {
            $user = Admin::where('email', $request->email)->first();
        } else {
            $user = Caller::where('email', $request->email)->first();
        }

        if (!$user) {
            AuditLogger::log(
                action: 'login_failed',
                description: "Failed login attempt - email not found: {$request->email}",
                request: $request
            );
            return response()->json(['error' => 'Email address not found'], 401);
        }

        if (!Hash::check($request->password, $user->password)) {
            AuditLogger::log(
                action: 'login_failed',
                description: "Failed login attempt - incorrect password for {$request->email}",
                request: $request
            );
            return response()->json(['error' => 'Incorrect password'], 401);
        }

        if ($user->status !== 'active') {
            return response()->json(['error' => 'Account is inactive'], 403);
        }

        // Use session-based authentication with appropriate guard
        $guard = $userType === 'admin' ? 'admin' : 'caller';
        Auth::guard($guard)->login($user);

        // Regenerate session to prevent session fixation attacks
        $request->session()->regenerate();

        AuditLogger::log(
            action: 'login_success',
            description: "User {$user->email} logged in successfully",
            model: get_class($user),
            modelId: $user->id,
            request: $request
        );

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'userType' => $userType,
                'role' => $userType === 'admin' ? $user->role : 'caller',
                'region' => $userType === 'admin' ? $user->region : null,
                'rtom' => $user->rtom
            ]
        ]);
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
                'region' => $user instanceof Admin ? $user->region : null,
                'rtom' => $user->rtom

            ]
        ]);
    }

    public function logout(Request $request)
    {
        try {
            if (!$request->user()) {
                return response()->json(['message' => 'Not authenticated'], 401);
            }

            $user = $request->user();
            AuditLogger::log(

                action: 'logout',
                description: "User {$user->email} logged out",
                model: get_class($user),
                modelId: $user->id,
                request: $request
            );

            // Logout from session and invalidate
            $userType = $user instanceof Admin ? 'admin' : 'caller';
            Auth::guard($userType)->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return response()->json(['message' => 'Logged out successfully']);
        } catch (\Exception $e) {
            \Log::error('Logout error: ' . $e->getMessage());
            return response()->json(['message' => 'Logout successful'], 200);
        }
    }
}
