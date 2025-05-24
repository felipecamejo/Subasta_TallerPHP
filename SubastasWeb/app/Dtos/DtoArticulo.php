<?php

namespace App\DTOs;

use App\Dtos\DtoCategoria;

class DtoArticulo {
    public $id;
    public $imagenes;
    public $especificacion;
    public $disponibilidad;
    public $condicion;
    public $vendedor_id;

    /** @var DtoCategoria[] */
    public array $categorias;

    public function __construct($imagenes, $especificacion, $disponibilidad, $condicion, $vendedor_id, $categorias)
    {
        $this->id = null;
        $this->imagenes = $imagenes;
        $this->especificacion = $especificacion;
        $this->disponibilidad = $disponibilidad;
        $this->condicion = $condicion;
        $this->vendedor_id = $vendedor_id;
        $this->categorias = $categorias;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'imagenes' => $this->imagenes,
            'especificacion' => $this->especificacion,
            'disponibilidad' => $this->disponibilidad,
            'condicion' => $this->condicion,
            'vendedor_id' => $this->vendedor_id,
            'categorias' => array_map(function($categoria) {
                return $categoria->toArray();
            }, $this->categorias)

        ];
    }
}