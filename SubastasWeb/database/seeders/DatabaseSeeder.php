<?php

namespace Database\Seeders;


use App\Models\Articulo;
use App\Models\CasaRemate;
use App\Models\Categoria;
use App\Models\Subasta;
use App\Models\Lote;
use App\Models\Puja;
use App\Models\Usuario;
use App\Models\Cliente;
use App\Models\Rematador;
use App\Models\Valoracion;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void {

        $casaRemate = CasaRemate::create([
            'id' => 1,
            'nombre' => 'Casa de Remates Aurora',
            'idFiscal' => '212345670018',
            'email' => 'cocoarodri@gmail.com',
            'telefono' => '099123456',
            'latitud' => -34.9011,
            'longitud' => -56.1645,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Crear valoración para la casa de remate
        Valoracion::create([
            'valoracion_total' => 23, // 4.6 promedio con 5 valoraciones (4+5+4+5+5 = 23)
            'cantidad_opiniones' => 5,
            'valorable_type' => 'App\\Models\\CasaRemate',
            'valorable_id' => $casaRemate->id,
        ]);

        Subasta::create([
            'id' => 1,
            'nombre' => 'alexis',
            'duracionMinutos' => 30,
            'activa' => false,
            'fecha' => '2025-08-02 10:00:00',
            'latitud' => -30.9011000,
            'longitud' => -50.1645000,
            'videoId' => 'DN8P7kukaGo',
            'rematador_id' => null,
            'casa_remate_id' => 1,
            'loteIndex' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Subasta::create([
            'id' => 2,
            'nombre' => 'leo',
            'duracionMinutos' => 30,
            'activa' => false,
            'fecha' => '2025-08-02 12:00:00',
            'latitud' => -34.9011,
            'longitud' => -56.1645,
            'videoId' => null,
            'rematador_id' => null,
            'casa_remate_id' => null,
            'loteIndex' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Lote::create([
            'id' => 1,
            'umbral' => 200,
            'valorBase' => 200,
            'pujaMinima' => 210,
            'subasta_id' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Lote::create([
            'id' => 2,
            'umbral' => 0,
            'valorBase' => 0,
            'pujaMinima' => 10,
            'subasta_id' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Puja::create([
            'id' => 1,
            'fechaHora' => now()->subMinutes(20), 
            'monto' => 212,
            'lote_id' => 1,
            'factura_id' => null,
            'cliente_id' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Puja::create([
            'id' => 2,
            'fechaHora' => now()->subMinutes(18), 
            'monto' => 213,
            'lote_id' => 1,
            'factura_id' => null,
            'cliente_id' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Puja::create([
            'id' => 3,
            'fechaHora' => now()->subMinutes(15), 
            'monto' => 300,
            'lote_id' => 2,
            'factura_id' => null,
            'cliente_id' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Puja::create([
            'id' => 4,
            'fechaHora' => now(), 
            'monto' => 301,
            'lote_id' => 2,
            'factura_id' => null,
            'cliente_id' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Categoria::create([
            'id' => 1,
            'nombre' => 'Electrónica',
            'categoria_padre_id' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Categoria::create([
            'id' => 2,
            'nombre' => 'Telefonos',
            'categoria_padre_id' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Categoria::create([
            'id' => 3,
            'nombre' => 'Muebles',
            'categoria_padre_id' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $articulo = Articulo::create([
            'nombre' => 'iPhone 14 Pro Max',
            'estado' => 'EXCELENTE',
            'imagenes' => 'iphone14pro.jpg',
            'especificacion' => 'iPhone 14 Pro Max 256GB, Color Azul Alpino, Batería al 95%, Incluye cargador original y caja',
            'disponibilidad' => true,
            'condicion' => 'Como nuevo, sin rayones ni golpes',
            'vendedor_id' => null,
            'lote_id' => 1,
            'categoria_id' => 2, 
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $articulo->save();

        //Pablo
        $clienteUsuario = Usuario::create([
            'nombre' => 'Steven Spielberg',
            'cedula' => '11111111',
            'email' => 'spielberg@example.com',
            'telefono' => '099111111',
            'imagen' => null,
            'contrasenia' => Hash::make('123456'),
            'latitud' => -34.9011,
            'longitud' => -56.1645,
        ]);

        $cliente1 = Cliente::create([
            'usuario_id' => $clienteUsuario->id,
        ]);

        // Crear valoración para el cliente
        Valoracion::create([
            'valoracion_total' => 15, // 5.0 promedio con 3 valoraciones (5+5+5 = 15)
            'cantidad_opiniones' => 3,
            'valorable_type' => 'App\\Models\\Cliente',
            'valorable_id' => $cliente1->usuario_id,
        ]);

        $rematadorUsuario = Usuario::create([
            'nombre' => 'Rematador Derremate',
            'cedula' => '22222222',
            'email' => 'rematador@example.com',
            'telefono' => '099222222',
            'imagen' => null,
            'contrasenia' => Hash::make('123456'),
            'latitud' => -34.9011,
            'longitud' => -56.1645,
        ]);

        Rematador::create([
            'usuario_id' => $rematadorUsuario->id,
            'matricula' => 'MAT1234',
        ]);

        $usuario1 = Usuario::create([
            'nombre' => 'Juan Pérez',
            'cedula' => '33333333',
            'email' => 'juan@example.com',
            'telefono' => '099333333',
            'imagen' => null,
            'contrasenia' => Hash::make('123456'),
            'latitud' => -34.9011,
            'longitud' => -56.1645,
        ]);

        $cliente2 = Cliente::create([
            'usuario_id' => $usuario1->id,
        ]);

        // Crear valoración para el cliente Juan Pérez
        Valoracion::create([
            'valoracion_total' => 12, // 4.0 promedio con 3 valoraciones (4+4+4 = 12)
            'cantidad_opiniones' => 3,
            'valorable_type' => 'App\\Models\\Cliente',
            'valorable_id' => $cliente2->usuario_id,
        ]);

        $usuario2 = Usuario::create([
            'nombre' => 'María González',
            'cedula' => '44444444',
            'email' => 'maria@example.com',
            'telefono' => '099444444',
            'imagen' => null,
            'contrasenia' => Hash::make('123456'),
            'latitud' => -34.9011,
            'longitud' => -56.1645,
        ]);

        $cliente3 = Cliente::create([
            'usuario_id' => $usuario2->id,
        ]);

        // Crear valoración para el cliente María González
        Valoracion::create([
            'valoracion_total' => 20, // 5.0 promedio con 4 valoraciones (5+5+5+5 = 20)
            'cantidad_opiniones' => 4,
            'valorable_type' => 'App\\Models\\Cliente',
            'valorable_id' => $cliente3->usuario_id,
        ]);

    }
}
