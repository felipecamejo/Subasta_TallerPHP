<?php

return [
    'paths' => [
        'api/*', 
        'sanctum/csrf-cookie', 
        'paypal/*',
        'docs/*', // Para Swagger UI
        'api/documentation', // Para Swagger JSON
    ],
    'allowed_methods' => ['*'], // Permite todos los métodos HTTP
    'allowed_origins' => ['*'], // Permite todos los orígenes (solo para desarrollo)
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'], // Permite todos los encabezados
    'exposed_headers' => [
        'Authorization',
        'Content-Type',
        'X-Requested-With',
    ],
    'max_age' => 86400, // Cache preflight por 24 horas
    'supports_credentials' => true, // Cambiado a true para Swagger
];