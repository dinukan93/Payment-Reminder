<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuditLogger
{
    /**
     * Log an action to the audit_logs table
     *
     * @param string $action
     * @param string $description
     * @param string|null $model
     * @param int|null $modelId
     * @param array|null $oldValues
     * @param array|null $newValues
     * @param Request|null $request
     */
    public static function log(
        string $action,
        string $description,
        ?string $model = null,
        ?int $modelId = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?Request $request = null
    ): void {
        // Allow disabling audit logging via .env
        if (!config('audit.enabled', env('AUDIT_LOGGING_ENABLED', true))) {
            return;
        }

        // Filter sensitive data from old and new values
        $oldValues = self::filterSensitiveData($oldValues);
        $newValues = self::filterSensitiveData($newValues);

        $user = Auth::user();

        AuditLog::create([
            'user_id' => $user ? $user->id : null,
            'user_type' => $user ? (get_class($user) === 'App\Models\Admin' ? 'admin' : 'caller') : null,
            'action' => $action,
            'description' => $description,
            'model_type' => $model,
            'model_id' => $modelId,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => $request ? $request->ip() : request()->ip(),
            'user_agent' => $request ? $request->userAgent() : request()->userAgent(),
            'url' => $request ? $request->fullUrl() : request()->fullUrl(),
            'method' => $request ? $request->method() : request()->method(),
        ]);
    }

    /**
     * Filter sensitive keys from an array
     *
     * @param array|null $data
     * @return array|null
     */
    private static function filterSensitiveData(?array $data): ?array
    {
        if (!$data) {
            return $data;
        }

        $sensitiveKeys = [
            'password',
            'password_confirmation',
            'token',
            'access_token',
            'refresh_token',
            'otp',
            'reset_token',
            'auth_token',
            'secret',
            'key',
            'api_key'
        ];

        foreach ($data as $key => $value) {
            if (in_array(strtolower($key), $sensitiveKeys)) {
                $data[$key] = '[REDACTED]';
            } elseif (is_array($value)) {
                $data[$key] = self::filterSensitiveData($value);
            }
        }

        return $data;
    }

    /**
     * Helper to log login actions
     */
    public static function logLogin(Request $request, $user): void
    {
        self::log(
            action: 'login',
            description: "User {$user->email} logged in",
            model: get_class($user),
            modelId: $user->id,
            request: $request
        );
    }

    /**
     * Helper to log logout actions
     */
    public static function logLogout(Request $request, $user): void
    {
        self::log(
            action: 'logout',
            description: "User {$user->email} logged out",
            model: get_class($user),
            modelId: $user->id,
            request: $request
        );
    }

    /**
     * Helper to log creation
     */
    public static function logCreate($model, ?Request $request = null, ?string $description = null): void
    {
        self::log(
            action: 'create',
            description: $description ?? "Created " . class_basename($model),
            model: get_class($model),
            modelId: $model->id,
            newValues: $model->toArray(),
            request: $request
        );
    }

    /**
     * Helper to log updates
     */
    public static function logUpdate($model, array $oldValues, ?Request $request = null, ?string $description = null): void
    {
        self::log(
            action: 'update',
            description: $description ?? "Updated " . class_basename($model),
            model: get_class($model),
            modelId: $model->id,
            oldValues: $oldValues,
            newValues: $model->toArray(),
            request: $request
        );
    }

    /**
     * Helper to log deletions
     */
    public static function logDelete($model, ?Request $request = null, ?string $description = null): void
    {
        self::log(
            action: 'delete',
            description: $description ?? "Deleted " . class_basename($model),
            model: get_class($model),
            modelId: $model->id,
            oldValues: $model->toArray(),
            request: $request
        );
    }
}
