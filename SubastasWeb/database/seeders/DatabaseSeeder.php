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

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void {

        CasaRemate::create([
            'id' => 1,
            'nombre' => 'Casa de Remates Aurora',
            'idFiscal' => '212345670018',
            'email' => 'cocoarodri@gmail.com',
            'telefono' => '099123456',
            'calificacion' => [4.5, 4.8, 4.2, 5.0, 4.7],
            'latitud' => -34.9011,
            'longitud' => -56.1645,
            'created_at' => now(),
            'updated_at' => now(),
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

        Cliente::create([
            'usuario_id' => $clienteUsuario->id,
            'calificacion' => 5,
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

    }
}
