<?php

return [
    'paths' => ['api/*'], // Permite rutas de la API y la ruta de CSRF de Sanctum
    'allowed_methods' => ['*'], // Permite todos los métodos HTTP
    'allowed_origins' => ['*'], // Permite todos los orígenes (solo para desarrollo)
    'allowed_headers' => ['*'], // Permite todos los encabezados
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false, // Esto es necesario para que funcione con Sanctum
];