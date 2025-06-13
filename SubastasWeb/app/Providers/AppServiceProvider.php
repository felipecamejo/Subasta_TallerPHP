<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Auth\Notifications\ResetPassword;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        ResetPassword::createUrlUsing(function ($notifiable, string $token) {
            return "http://localhost:4200/restablecer-contrasena?token=$token&email=" . urlencode($notifiable->email);
        });
    }
}