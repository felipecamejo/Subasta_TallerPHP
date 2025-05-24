<?php
namespace App\DTOs;

use App\Models\Categoria;
use App\Models\Articulo;

class DtoCategoria
{
    public $id = null;
    public $nombre;
    public $categoria_padre_id;

    /** @var DtoCategoria[] */
    public array $categoriasHijas = [];

    /** @var DtoArticulo[] */
    public array $articulos = [];

    public function __construct($nombre, $categoria_padre_id) {
        $this->id = null;
        $this->nombre = $nombre;
        $this->categoria_padre_id = $categoria_padre_id;
        $this->categoriasHijas = [];
        $this->articulos = [];
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'nombre' => $this->nombre,
            'categoria_padre_id' => $this->categoria_padre_id,
            'categoriasHijas' => array_map(fn($cat) => $cat->toArray(), $this->categoriasHijas),
            'articulosIds' => $this->articulos,
        ];
    }
}
