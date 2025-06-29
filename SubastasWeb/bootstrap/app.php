<?php

use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Http\Middleware\IsAdmin;
use App\Providers\AppServiceProvider;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        //  CORS y Sanctum en orden
        $middleware->api(prepend: [
            \Illuminate\Http\Middleware\HandleCors::class,
            EnsureFrontendRequestsAreStateful::class, // 👈 AGREGALO ACÁ
        ]);

        //  Alias para middlewares personalizados
        $middleware->alias([
            'isAdmin' => IsAdmin::class,
        ]);
    })
    ->withProviders([
        AppServiceProvider::class,
    ])
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })
    ->create();