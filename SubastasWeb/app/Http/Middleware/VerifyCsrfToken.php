<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    /**
     * Las rutas que deben ser excluidas del CSRF.
     *
     * @var array
     */
    protected $except = [
        'api/*', // Excluye todas las rutas de la API
    ];
}
