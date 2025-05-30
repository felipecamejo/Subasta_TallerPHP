<?php

namespace Database\Factories;

use App\Models\Usuario;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

class UsuarioFactory extends Factory
{
    protected $model = Usuario::class;

    public function definition()
    {
        $password = 'password'; // contraseña por defecto para los usuarios de prueba

        return [
            'nombre' => $this->faker->name(),
            'email' => $this->faker->unique()->safeEmail(),
            'contrasenia' => Hash::make($password),
            // otros campos si los tenés en la tabla usuarios
        ];
    }
}