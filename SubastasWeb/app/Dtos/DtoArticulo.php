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
    public  $categoria;

    public function __construct($id, $estado,$nombre, $imagenes, $especificacion, $disponibilidad, $condicion, $vendedor, $categoria, $lote) {
        $this->id = $id;
        $this->nombre = $nombre;
        $this->imagenes = $imagenes;
        $this->especificacion = $especificacion;
        $this->disponibilidad = $disponibilidad;
        $this->condicion = $condicion;
        $this->vendedor = $vendedor;
        $this->categoria = $categoria;
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
            'categoria' => $this->categoria,
            'lote' => $this->lote,
        ];
    }
}