<?php

require __DIR__ . '/vendor/autoload.php';

use Illuminate\Database\Capsule\Manager as Capsule;
use App\Models\Usuario;
use Illuminate\Support\Facades\Hash;

// Configurar Eloquent (Laravel ORM) fuera de Laravel
$capsule = new Capsule;

$capsule->addConnection([
    'driver'    => 'pgsql',
    'host'      => '127.0.0.1',   // Cambialo si usás otro host
    'database'  => 'laravel_project', // Pon el nombre de tu base
    'username'  => 'postgres', // Cambialo a tu usuario
    'password'  => '123', // Cambialo a tu contraseña
    'charset'   => 'utf8',
    'collation' => 'utf8_unicode_ci',
    'prefix'    => '',
]);

$capsule->setAsGlobal();
$capsule->bootEloquent();

// Ahora probamos
$email = 'rematador@example.com';
$password = '123456';

$usuario = Usuario::where('email', $email)->first();

if (!$usuario) {
    echo "Usuario no encontrado\n";
    exit;
}

if (Hash::check($password, $usuario->contrasenia)) {
    echo "La contraseña es correcta para el usuario $email\n";
} else {
    echo "La contraseña es INCORRECTA para el usuario $email\n";
}
