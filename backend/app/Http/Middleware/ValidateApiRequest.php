<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ValidateApiRequest
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Allow OPTIONS requests for CORS preflight
        if ($request->isMethod('OPTIONS')) {
            return $next($request);
        }

        // Check for custom header that your frontend will send
        if (!$request->hasHeader('X-Requested-With') || $request->header('X-Requested-With') !== 'XMLHttpRequest') {
            return response()->json([
                'message' => 'Direct API access is not allowed.'
            ], 403);
        }

        return $next($request);
    }
}
