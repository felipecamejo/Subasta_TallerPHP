<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Usuario;
use App\Models\CasaRemate;
use Illuminate\Support\Facades\Hash;
use Faker\Factory as Faker;
use Illuminate\Support\Facades\DB;

class CasaRemateSeeder extends Seeder
{
    public function run(): void
    {
        // Casa original fija
        $usuario = Usuario::create([
            'nombre' => 'Casa de Remates Aurora',
            'email' => 'cocoarodri@gmail.com',
            'cedula' => '212345670018', // Usamos el idFiscal como cédula para casas de remate
            'telefono' => '099123456',
            'contrasenia' => Hash::make('123456789'),
            'latitud' => -34.9011,
            'longitud' => -56.1645,
            'email_verified_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $casaRemate = CasaRemate::create([
            'usuario_id' => $usuario->id,
            'idFiscal' => '212345670018',
            'activo' => false,
        ]);

        
        /*
        // Casas generadas con Faker
        $faker = Faker::create('es_UY');

        for ($i = 0; $i < 100; $i++) {
            $nombre = 'Casa de Remates ' . $faker->lastName;
            $email = $faker->unique()->safeEmail;
            $cedula = $faker->unique()->numerify('###########');
            $telefono = $faker->numerify('09########');
            $lat = $faker->latitude(-35, -30);
            $lng = $faker->longitude(-58, -53);

            $usuario = Usuario::create([
                'nombre' => $nombre,
                'email' => $email,
                'cedula' => $cedula,
                'telefono' => $telefono,
                'contrasenia' => Hash::make('12345678'),
                'latitud' => $lat,
                'longitud' => $lng,
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $casaRemate = CasaRemate::create([
                'usuario_id' => $usuario->id,
                'idFiscal' => $cedula,
                'activo' => $faker->boolean(80),
            ]);

            // Insertar valoración solo con los campos válidos
            DB::table('valoraciones')->insert([
                'total_puntaje' => $faker->numberBetween(0, 50),
                'cantidad_opiniones' => $faker->numberBetween(0, 10),
                'usuario_id' => $usuario->id,
                'chat_id' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    */
    }
}
