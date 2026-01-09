<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class FilterByRegionRtom
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // If no user or superadmin, no filtering needed
        if (!$user || $user->isSuperAdmin()) {
            return $next($request);
        }

        // Apply region/rtom filtering based on user role
        if ($user->isRegionAdmin() && $user->region) {
            $request->merge(['filter_region' => $user->region]);
        } elseif (($user->isRtomAdmin() || $user->isSupervisor()) && $user->rtom) {
            $request->merge(['filter_rtom' => $user->rtom]);
        }

        return $next($request);
        
    }
}
