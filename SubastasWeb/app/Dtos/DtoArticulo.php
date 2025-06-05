<?php

namespace App\DTOs;

use App\Dtos\DtoCategoria;

class DtoArticulo {
    public $id;
    public $nombre;
    public $imagenes;
    public $especificacion;
    public $disponibilidad;
    public $condicion;
    public $vendedor;
    public $estado; 
    public $lote;

    /** @var DtoCategoria[] */
    public array $categorias;

    public function __construct($id, $estado,$nombre, $imagenes, $especificacion, $disponibilidad, $condicion, $vendedor, $categorias, $lote) {
        $this->id = $id;
        $this->nombre = $nombre;
        $this->imagenes = $imagenes;
        $this->especificacion = $especificacion;
        $this->disponibilidad = $disponibilidad;
        $this->condicion = $condicion;
        $this->vendedor = $vendedor;
        $this->categorias = $categorias;
        $this->lote = $lote;
        $this->estado = $estado;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'nombre' => $this->nombre,
            'imagenes' => $this->imagenes,
            'especificacion' => $this->especificacion,
            'disponibilidad' => $this->disponibilidad,
            'condicion' => $this->condicion,
            'estado' => $this->estado,
            'vendedor' => $this->vendedor,
            'categorias' => array_map(function($categoria) {
                return $categoria->toArray();
            }, $this->categorias),
            'lote' => $this->lote,
        ];
    }
}