<?php
namespace App\DTOs;

use App\Models\Categoria;
use App\Models\Articulo;

class DtoCategoria
{
    public $id = null;
    public $nombre;
    public $categoria_padre;

    /** @var DtoCategoria[] */
    public array $categoriasHijas = [];

    /** @var DtoArticulo[] */
    public array $articulos = [];

    public function __construct($id, $nombre, $categoria_padre, $categoriasHijas, $articulos) {
        $this->id = $id;
        $this->nombre = $nombre;
        $this->categoria_padre = $categoria_padre;
        $this->categoriasHijas = $categoriasHijas;
        $this->articulos = $articulos;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'nombre' => $this->nombre,
            'categoria_padre' => $this->categoria_padre,
            'categoriasHijas' => array_map(fn($categoria) => $categoria->toArray(), $this->categoriasHijas),
            'articulos' => array_map(fn($articulo) => $articulo->toArray(), $this->articulos)
        ];
    }
}
