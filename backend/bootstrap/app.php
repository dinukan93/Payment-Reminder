<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Global middleware (runs for ALL requests including OPTIONS)
        $middleware->prepend([
            \App\Http\Middleware\AddSecurityHeadersToOptions::class, // Add CSP to OPTIONS requests
            \App\Http\Middleware\SecurityHeadersMiddleware::class,    // Add security headers globally
        ]);

        // Enable session and CSRF for API routes (required for Sanctum SPA authentication)
        $middleware->api(prepend: [
            \Illuminate\Http\Middleware\HandleCors::class,
            \App\Http\Middleware\ValidateApiRequest::class,
        ]);

        // Also ensure stateful API middleware is enabled for Sanctum
        $middleware->statefulApi();

        // Exclude authentication routes from CSRF validation
        // These routes are called before the user has a session/CSRF token
        $middleware->validateCsrfTokens(except: [
            'api/login',
            'api/send-otp',
            'api/verify-otp',
            'sanctum/csrf-cookie',
        ]);

        // Override redirect for unauthenticated API requests
        $middleware->redirectGuestsTo(function ($request) {

            return null;
        });
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
