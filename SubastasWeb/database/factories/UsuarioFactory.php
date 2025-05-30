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
            'cedula' => $this->faker->unique()->numerify('########'),
            'email' => $this->faker->unique()->safeEmail(),
            'telefono' => $this->faker->phoneNumber(),
            'imagen' => null,
            'contrasenia' => Hash::make('password'), // o '123456'
            'latitud' => $this->faker->latitude(),
            'longitud' => $this->faker->longitude(),
        ];
    }
}