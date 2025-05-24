<?php

namespace App\DTOs;
class DtoVendedor {
    public $id;
    public $nombre;

    /** @var DtoFactura[] */
    public array $facturas;

    /** @var DtoArticulo[] */
    public array $articulos;

    /** @var DtoCasaRemate[] */
    public array $casaRemates;

    public function __construct($nombre, $facturas, $articulos, $casaRemates) {
        $this->id = null;
        $this->nombre = $nombre;
        $this->facturas = $facturas;
        $this->articulos = $articulos;
        $this->casaRemates = $casaRemates;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'nombre' => $this->nombre,
            'facturas' => array_map(function($factura) {
                return $factura->toArray();
            }, $this->facturas),
            'articulos' => array_map(function($articulo) {
                return $articulo->toArray();
            }, $this->articulos),
            'casaRemates' => array_map(function($casaRemate) {
                return $casaRemate->toArray();
            }, $this->casaRemates)
        ];
    }
}