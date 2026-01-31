<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Admin;
use App\Models\Caller;
use App\Models\Setting;
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

        // Determine user type
        $userType = $user instanceof Admin ? 'admin' : 'caller';

        // Get or create settings
        $setting = $user->setting;
        if (!$setting) {
            $setting = Setting::create([
                'user_id' => $user->id,
                'user_type' => $userType,
                'avatar' => null,
                'email_notifications' => false,
                'payment_reminder' => false,
                'call_notifications' => false,
                'language' => 'English',
                'timezone' => 'UTC',
            ]);
        }

        return response()->json([
            'id' => $user->id,
            'callerId' => $user->callerId ?? $user->adminId ?? '',
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone ?? '',
            'avatar' => $setting->avatar ?? '',
            'role' => $user->role ?? 'caller',
            'preferences' => [
                'emailNotifications' => (bool) $setting->email_notifications,
                'paymentReminder' => (bool) $setting->payment_reminder,
                'callNotifications' => (bool) $setting->call_notifications,
                'language' => $setting->language ?? 'English',
                'timezone' => $setting->timezone ?? 'UTC',
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

        // Update user's name and phone
        $user->update([
            'name' => $validated['name'] ?? $user->name,
            'phone' => $validated['phone'] ?? $user->phone,
        ]);

        // Update settings with avatar
        if (array_key_exists('avatar', $validated)) {
            $userType = $user instanceof Admin ? 'admin' : 'caller';
            $setting = $user->setting ?? Setting::create([
                'user_id' => $user->id,
                'user_type' => $userType,
            ]);
            $setting->update(['avatar' => $validated['avatar']]);
        }

        return response()->json([
            'msg' => 'Profile updated successfully',
            'data' => [
                'name' => $user->name,
                'phone' => $user->phone,
                'avatar' => $user->setting->avatar ?? null
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

        // Get or create settings
        $userType = $user instanceof Admin ? 'admin' : 'caller';
        $setting = $user->setting ?? Setting::create([
            'user_id' => $user->id,
            'user_type' => $userType,
        ]);

        // Map camelCase to snake_case for database
        $updateData = [
            'email_notifications' => isset($validated['emailNotifications']) ? $validated['emailNotifications'] : $setting->email_notifications,
            'payment_reminder' => isset($validated['paymentReminder']) ? $validated['paymentReminder'] : $setting->payment_reminder,
            'call_notifications' => isset($validated['callNotifications']) ? $validated['callNotifications'] : $setting->call_notifications,
            'language' => $validated['language'] ?? $setting->language,
            'timezone' => $validated['timezone'] ?? $setting->timezone,
        ];

        $setting->update($updateData);

        return response()->json([
            'msg' => 'Preferences updated successfully',
            'data' => [
                'emailNotifications' => (bool) $updateData['email_notifications'],
                'paymentReminder' => (bool) $updateData['payment_reminder'],
                'callNotifications' => (bool) $updateData['call_notifications'],
                'language' => $updateData['language'],
                'timezone' => $updateData['timezone'],
            ]
        ]);
    }
}
