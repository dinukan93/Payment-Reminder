<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogger
{
    /**
     * Log an action
     */
    public static function log(
        string $action,
        ?string $description = null,
        ?string $model = null,
        ?int $modelId = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?Request $request = null
    ) {
        $user = $request ? $request->user() : null;

        AuditLog::create([
            'user_type' => $user ? ($user instanceof \App\Models\Admin ? 'admin' : 'caller') : null,
            'user_id' => $user ? $user->id : null,
            'user_email' => $user ? $user->email : null,
            'action' => $action,
            'model' => $model,
            'model_id' => $modelId,
            'description' => $description,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => $request ? $request->ip() : null,
            'user_agent' => $request ? $request->userAgent() : null,
            'url' => $request ? $request->fullUrl() : null,
            'method' => $request ? $request->method() : null,
        ]);
    }

    /**
     * Log login attempt
     */
    public static function logLogin(Request $request, $user, bool $success)
    {
        self::log(
            action: $success ? 'login_success' : 'login_failed',
            description: $success
            ? "User {$user->email} logged in successfully"
            : "Failed login attempt for {$request->email}",
            model: $success ? get_class($user) : null,
            modelId: $success ? $user->id : null,
            request: $request
        );
    }

    /**
     * Log logout
     */
    public static function logLogout(Request $request)
    {
        $user = $request->user();
        self::log(
            action: 'logout',
            description: "User {$user->email} logged out",
            model: get_class($user),
            modelId: $user->id,
            request: $request
        );
    }

    /**
     * Log model creation
     */
    public static function logCreate(Request $request, $model, ?string $description = null)
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
     * Log model update
     */
    public static function logUpdate(Request $request, $model, array $oldValues, ?string $description = null)
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
     * Log model deletion
     */
    public static function logDelete(Request $request, $model, ?string $description = null)
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
