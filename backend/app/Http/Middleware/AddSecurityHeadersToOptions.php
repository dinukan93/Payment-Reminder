<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Add security headers to OPTIONS (preflight) requests
 * This middleware runs before CORS to ensure security headers are present
 */
class AddSecurityHeadersToOptions
{
    public function handle(Request $request, Closure $next): Response
    {
        // If this is an OPTIONS request, add security headers immediately
        if ($request->isMethod('OPTIONS')) {
            $response = $next($request);

            // Detect environment
            $isDev = config('app.env') !== 'production';

            // Generate a nonce for consistency (though OPTIONS returns no scripts)
            $nonce = base64_encode(random_bytes(16));

            // Build CSP based on environment
            if ($isDev) {
                // If CSP is already present (from proxy), don't overwrite it
                if (!$response->headers->has('Content-Security-Policy')) {
                    $nonce = base64_encode(random_bytes(16));
                    $cspDirectives = [
                        "default-src 'self'",
                        "script-src 'self' 'nonce-{$nonce}' 'unsafe-eval'",
                        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                        "font-src 'self' https://fonts.gstatic.com data:",
                        "img-src 'self' data:",
                        "connect-src 'self' http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:*",
                        "frame-ancestors 'none'",
                        "base-uri 'self'",
                        "form-action 'self'",
                    ];
                    $response->headers->set('Content-Security-Policy', implode('; ', $cspDirectives));
                }
            } else {
                $cspDirectives = [
                    "default-src 'self'",
                    "script-src 'self'",
                    "style-src 'self' https://fonts.googleapis.com",
                    "font-src 'self' https://fonts.gstatic.com data:",
                    "img-src 'self' data:",
                    "connect-src 'self'",
                    "frame-ancestors 'none'",
                    "base-uri 'self'",
                    "form-action 'self'",
                ];
                $response->headers->set('Content-Security-Policy', implode('; ', $cspDirectives));
            }

            $response->headers->set('X-Frame-Options', 'DENY');
            $response->headers->set('X-Content-Type-Options', 'nosniff');
            $response->headers->set('X-XSS-Protection', '1; mode=block');
            $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
            $response->headers->set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

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

        return $next($request);
    }
}
