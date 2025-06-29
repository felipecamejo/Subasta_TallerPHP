<?php

namespace App\Providers;

use App\Services\SimpleRedisClient;
use Illuminate\Support\ServiceProvider;

class CustomRedisServiceProvider extends ServiceProvider
{
    public function register()
    {
        $this->app->singleton('redis', function ($app) {
            return new SimpleRedisClient(
                config('database.redis.default.host', '127.0.0.1'),
                config('database.redis.default.port', 6379)
            );
        });
    }

    public function boot()
    {
        //
    }
}
