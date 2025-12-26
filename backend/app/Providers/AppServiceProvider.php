<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Models\Admin;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Define superadmin gate
        Gate::define('superadmin', function ($user) {
            return $user instanceof Admin && $user->role === 'superadmin';
        });

        // Define region_admin gate
        Gate::define('region_admin', function ($user) {
            return $user instanceof Admin && $user->role === 'region_admin';
        });

        // Define rtom_admin gate
        Gate::define('rtom_admin', function ($user) {
            return $user instanceof Admin && $user->role === 'rtom_admin';
        });
    }
}
