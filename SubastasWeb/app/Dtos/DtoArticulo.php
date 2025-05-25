<?php

namespace App\DTOs;

use App\Dtos\DtoCategoria;

class DtoArticulo {
    public $id;
    public $imagenes;
    public $especificacion;
    public $disponibilidad;
    public $condicion;
    public $vendedor;

    /** @var DtoCategoria[] */
    public array $categorias;

    public function __construct($id, $imagenes, $especificacion, $disponibilidad, $condicion, $vendedor, $categorias){
        $this->id = $id;
        $this->imagenes = $imagenes;
        $this->especificacion = $especificacion;
        $this->disponibilidad = $disponibilidad;
        $this->condicion = $condicion;
        $this->vendedor = $vendedor;
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
            'vendedor' => $this->vendedor,
            'categorias' => array_map(function($categoria) {
                return $categoria->toArray();
            }, $this->categorias)
        ];
    }
}