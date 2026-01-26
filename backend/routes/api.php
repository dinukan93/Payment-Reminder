<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\CallerController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\UploadController;
use App\Http\Controllers\RequestController;
use App\Http\Controllers\DataDistributionController;
use App\Http\Controllers\AutoAssignmentController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\PodFilterConfigController;
use App\Http\Controllers\ExcelUploadHistoryController;
use App\Http\Controllers\ReportController;


// Public routes with rate limiting to prevent brute force attacks
Route::middleware('throttle:5,1')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/send-otp', [AuthController::class, 'sendOtp']);
    Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
});

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Customers
    Route::get('/customers', [CustomerController::class, 'index']);
    Route::post('/customers', [CustomerController::class, 'store']);
    Route::get('/customers/{id}', [CustomerController::class, 'show']);
    Route::put('/customers/{id}', [CustomerController::class, 'update']);
    Route::put('/customers/{id}/contact', [CustomerController::class, 'updateContact']);
    Route::delete('/customers/{id}', [CustomerController::class, 'destroy']);
    Route::post('/customers/{id}/contact-history', [CustomerController::class, 'addContactHistory']);

    // Callers
    Route::get('/callers', [CallerController::class, 'index']);
    Route::post('/callers', [CallerController::class, 'store']);
    Route::get('/callers/next-id', [CallerController::class, 'nextCallerId']); // Must come before {id} route
    Route::get('/callers/{id}', [CallerController::class, 'show']);
    Route::put('/callers/{id}', [CallerController::class, 'update']);
    Route::delete('/callers/{id}', [CallerController::class, 'destroy']);
    Route::post('/callers/{id}/report', [ReportController::class, 'submitReport']);
    Route::get('/reports', [ReportController::class, 'index']);

    // Requests
    Route::get('/requests', [RequestController::class, 'index']);
    Route::post('/requests', [RequestController::class, 'store']);
    Route::get('/requests/{id}', [RequestController::class, 'show']);
    Route::put('/requests/{id}', [RequestController::class, 'update']);
    Route::post('/requests/{id}/accept', [RequestController::class, 'accept']);
    Route::post('/requests/{id}/decline', [RequestController::class, 'decline']);
    Route::post('/requests/{id}/cancel', [RequestController::class, 'cancel']);

    // Auto Assignment
    Route::post('/auto-assign', [AutoAssignmentController::class, 'autoAssign']);

    // Admin
    Route::get('/admin/dashboard-stats', [AdminController::class, 'getDashboardStats']);
    Route::get('/admin/assigned-callers', [AdminController::class, 'getAssignedCallers']);
    Route::get('/admin/weekly-calls', [AdminController::class, 'getWeeklyCalls']);

    // Settings
    Route::get('/settings', [SettingsController::class, 'getSettings']);
    Route::put('/settings/profile', [SettingsController::class, 'updateProfile']);
    Route::put('/settings/password', [SettingsController::class, 'updatePassword']);
    Route::put('/settings/preferences', [SettingsController::class, 'updatePreferences']);

    // Upload
    Route::post('/upload/parse', [UploadController::class, 'parse']);
    Route::post('/upload/import', [UploadController::class, 'import']);
    Route::post('/upload/mark-paid', [UploadController::class, 'markPaid']);

    // Data Distribution
    Route::post('/distribution/distribute', [DataDistributionController::class, 'distributeToRegionsAndRtoms']);
    Route::get('/distribution/summary', [DataDistributionController::class, 'getDistributionSummary']);

    // POD Filter Configuration (read access for all authenticated users)
    Route::get('/pod-filter-config', [PodFilterConfigController::class, 'index']);

    // Superadmin routes
    Route::middleware('can:superadmin')->group(function () {
        Route::get('/superadmin/admins', [AdminController::class, 'getAllAdmins']);
        Route::post('/superadmin/admins', [AdminController::class, 'createAdmin']);
        Route::put('/superadmin/admins/{id}', [AdminController::class, 'updateAdmin']);
        Route::delete('/superadmin/admins/{id}', [AdminController::class, 'deleteAdmin']);
        Route::get('/superadmin/rtoms', [AdminController::class, 'getRtoms']);

        // POD Filter Configuration (write access for superadmin only)
        Route::put('/pod-filter-config', [PodFilterConfigController::class, 'update']);
        Route::post('/pod-filter-config/reset', [PodFilterConfigController::class, 'reset']);

        // Excel Upload History
        Route::get('/excel-upload-history', [ExcelUploadHistoryController::class, 'index']);
        Route::get('/excel-upload-history/latest', [ExcelUploadHistoryController::class, 'latest']);
        Route::get('/excel-upload-history/{id}', [ExcelUploadHistoryController::class, 'show']);
        Route::get('/excel-upload-history/{id}/download', [ExcelUploadHistoryController::class, 'download']);
        Route::delete('/excel-upload-history/{id}', [ExcelUploadHistoryController::class, 'destroy']);
    });

    // Region admin routes
    Route::middleware('can:region_admin')->group(function () {
        Route::get('/region-admin/rtom-admins', [AdminController::class, 'getRtomAdminsForRegion']);
        Route::post('/region-admin/rtom-admins', [AdminController::class, 'createRtomAdmin']);
        Route::put('/region-admin/rtom-admins/{id}', [AdminController::class, 'updateRtomAdmin']);
        Route::delete('/region-admin/rtom-admins/{id}', [AdminController::class, 'deleteRtomAdmin']);
    });

    // RTOM admin routes
    Route::middleware('can:rtom_admin')->group(function () {
        Route::get('/rtom-admin/supervisors', [AdminController::class, 'getSupervisorsForRtom']);
        Route::post('/rtom-admin/supervisors', [AdminController::class, 'createSupervisor']);
        Route::put('/rtom-admin/supervisors/{id}', [AdminController::class, 'updateSupervisor']);
        Route::delete('/rtom-admin/supervisors/{id}', [AdminController::class, 'deleteSupervisor']);
    });
});
