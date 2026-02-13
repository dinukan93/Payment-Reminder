<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeadersMiddleware
{
    /**
     * Handle an incoming request and add security headers to the response.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Detect environment
        $isDev = config('app.env') !== 'production';

        // Content Security Policy - Prevents XSS attacks
        if ($isDev) {
            // IN DEV: Priority goes to existing headers to avoid Nonce mismatches.
            if ($response->headers->has('Content-Security-Policy')) {
                // Header already exists, do not touch it.
            } else {
                // Fallback for direct backend pages
                $nonce = base64_encode(random_bytes(16));
                $cspDirectives = [
                    "default-src 'self'",
                    "script-src 'self' 'nonce-{$nonce}' 'unsafe-eval'",
                    "style-src 'self' 'unsafe-inline'",
                    "font-src 'self' data:",
                    "img-src 'self' data:",
                    "connect-src 'self' http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:*",
                    "frame-ancestors 'none'",
                    "base-uri 'self'",
                    "form-action 'self'",
                ];
                $response->headers->set('Content-Security-Policy', implode('; ', $cspDirectives));
            }
        } else {
            // Production CSP: Strict security
            $cspDirectives = [
                "default-src 'self'",
                "script-src 'self'",
                "style-src 'self'",
                "font-src 'self' data:",
                "img-src 'self' data:",
                "connect-src 'self'",
                "frame-ancestors 'none'",
                "base-uri 'self'",
                "form-action 'self'",
            ];
            $response->headers->set('Content-Security-Policy', implode('; ', $cspDirectives));
        }

        // Prevent clickjacking attacks
        $response->headers->set('X-Frame-Options', 'DENY');

        // Prevent MIME-sniffing attacks
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // Enable XSS protection for older browsers
        $response->headers->set('X-XSS-Protection', '1; mode=block');

        // Control referrer information
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Permissions Policy - Restrict browser features
        $response->headers->set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

        // Strict Transport Security - Force HTTPS (only in production with HTTPS)
        if (config('app.env') === 'production' && $request->secure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        // Remove informational headers to hide server technology
        $informationalHeaders = ['X-Powered-By', 'Server', 'X-Generator'];
        foreach ($informationalHeaders as $header) {
            $response->headers->remove($header);
            if (function_exists('header_remove')) {
                @header_remove($header);
            }
        }

        return $response;
    }
}
