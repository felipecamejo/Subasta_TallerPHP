<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Articulo;
use App\Models\Lote;
use App\Models\Categoria;

class ArticuloSeeder extends Seeder
{
    public function run(): void
    {
        $lote = Lote::find(1);
        $categoria = Categoria::find(2); // Telefonos

        if (!$lote || !$categoria) {
            $this->command->warn('⚠️ Lote 1 o Categoría 2 no encontrados. Ejecutá los seeders anteriores primero.');
            return;
        }

        $articulo = Articulo::create([
            'nombre' => 'iPhone 14 Pro Max',
            'estado' => 'EXCELENTE',
            'imagenes' => 'iphone14pro.jpg',
            'especificacion' => 'iPhone 14 Pro Max 256GB, Color Azul Alpino, Batería al 95%, Incluye cargador original y caja',
            'disponibilidad' => true,
            'condicion' => 'Como nuevo, sin rayones ni golpes',
            'vendedor_id' => null,
            'lote_id' => $lote->id,
            'categoria_id' => $categoria->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
