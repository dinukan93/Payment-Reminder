<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\CallerController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\UploadController;
use App\Http\Controllers\RequestController;

// Public routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/send-otp', [AuthController::class, 'sendOtp']);
Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);

// Protected routes
Route::middleware('jwt.auth')->group(function () {
    // Auth
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    
    // Customers
    Route::get('/customers', [CustomerController::class, 'index']);
    Route::post('/customers', [CustomerController::class, 'store']);
    Route::get('/customers/{id}', [CustomerController::class, 'show']);
    Route::put('/customers/{id}', [CustomerController::class, 'update']);
    Route::delete('/customers/{id}', [CustomerController::class, 'destroy']);
    Route::post('/customers/{id}/contact-history', [CustomerController::class, 'addContactHistory']);
    
    // Callers
    Route::get('/callers', [CallerController::class, 'index']);
    Route::post('/callers', [CallerController::class, 'store']);
    Route::get('/callers/{id}', [CallerController::class, 'show']);
    Route::put('/callers/{id}', [CallerController::class, 'update']);
    Route::delete('/callers/{id}', [CallerController::class, 'destroy']);
    
    // Requests
    Route::get('/requests', [RequestController::class, 'index']);
    Route::post('/requests', [RequestController::class, 'store']);
    Route::get('/requests/{id}', [RequestController::class, 'show']);
    Route::put('/requests/{id}', [RequestController::class, 'update']);
    Route::post('/requests/{id}/accept', [RequestController::class, 'accept']);
    Route::post('/requests/{id}/decline', [RequestController::class, 'decline']);
    
    // Admin
    Route::get('/admin/dashboard-stats', [AdminController::class, 'getDashboardStats']);
    Route::get('/admin/assigned-callers', [AdminController::class, 'getAssignedCallers']);
    Route::get('/admin/weekly-calls', [AdminController::class, 'getWeeklyCalls']);
    
    // Upload
    Route::post('/upload/parse', [UploadController::class, 'parse']);
    Route::post('/upload/import', [UploadController::class, 'import']);
    Route::post('/upload/mark-paid', [UploadController::class, 'markPaid']);
    
    // Superadmin routes
    Route::middleware('superadmin')->group(function () {
        Route::get('/superadmin/admins', [AdminController::class, 'getAllAdmins']);
        Route::post('/superadmin/admins', [AdminController::class, 'createAdmin']);
        Route::put('/superadmin/admins/{id}', [AdminController::class, 'updateAdmin']);
        Route::delete('/superadmin/admins/{id}', [AdminController::class, 'deleteAdmin']);
        Route::get('/superadmin/rtoms', [AdminController::class, 'getRtoms']);
    });
});
