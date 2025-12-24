<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Admin;
use App\Models\Caller;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class SettingsController extends Controller
{
    /**
     * Get user settings
     */
    public function getSettings(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        return response()->json([
            'id' => $user->id,
            'callerId' => $user->callerId ?? $user->adminId ?? '',
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone ?? '',
            'avatar' => $user->avatar ?? '',
            'role' => $user->role,
            'preferences' => [
                'emailNotifications' => $user->email_notifications ?? false,
                'paymentReminder' => $user->payment_reminder ?? false,
                'callNotifications' => $user->call_notifications ?? false,
                'language' => $user->language ?? 'English',
                'timezone' => $user->timezone ?? 'UTC',
            ]
        ]);
    }

    /**
     * Update profile (name, phone, avatar)
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'avatar' => 'nullable|string'
        ]);

        $user->update($validated);

        return response()->json([
            'msg' => 'Profile updated successfully',
            'data' => [
                'name' => $user->name,
                'phone' => $user->phone,
                'avatar' => $user->avatar
            ]
        ]);
    }

    /**
     * Update password
     */
    public function updatePassword(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'currentPassword' => 'required|string',
            'newPassword' => 'required|string|min:6|confirmed',
        ]);

        // Check if current password is correct
        if (!Hash::check($validated['currentPassword'], $user->password)) {
            throw ValidationException::withMessages([
                'currentPassword' => ['The provided password is incorrect.'],
            ]);
        }

        // Update password
        $user->update(['password' => $validated['newPassword']]);

        return response()->json([
            'msg' => 'Password updated successfully'
        ]);
    }

    /**
     * Update preferences
     */
    public function updatePreferences(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'emailNotifications' => 'boolean',
            'paymentReminder' => 'boolean',
            'callNotifications' => 'boolean',
            'language' => 'string|max:50',
            'timezone' => 'string|max:50',
        ]);

        // Map camelCase to snake_case for database
        $updateData = [
            'email_notifications' => $validated['emailNotifications'] ?? false,
            'payment_reminder' => $validated['paymentReminder'] ?? false,
            'call_notifications' => $validated['callNotifications'] ?? false,
            'language' => $validated['language'] ?? 'English',
            'timezone' => $validated['timezone'] ?? 'UTC',
        ];

        $user->update($updateData);

        return response()->json([
            'msg' => 'Preferences updated successfully',
            'data' => [
                'emailNotifications' => $user->email_notifications,
                'paymentReminder' => $user->payment_reminder,
                'callNotifications' => $user->call_notifications,
                'language' => $user->language,
                'timezone' => $user->timezone,
            ]
        ]);
    }
}
