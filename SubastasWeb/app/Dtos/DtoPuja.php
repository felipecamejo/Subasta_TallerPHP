<?php

namespace App\DTOs;

use App\DTOs\DtoCliente;

namespace App\DTOs;

use App\DTOs\DtoCliente;

class DtoPuja
{
    public $id;
    public $fechaHora;
    public $monto;
    public $lote;
    public $factura;
    public ?DtoCliente $cliente;

    public function __construct($id, $fechaHora, $monto, $lote, $factura, $cliente)
    {
        $this->id = $id;
        $this->fechaHora = $fechaHora;
        $this->monto = $monto;
        $this->lote = $lote;
        $this->factura = $factura;
        $this->cliente = $cliente;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'fechaHora' => $this->fechaHora,
            'monto' => $this->monto,
            'lote' => $this->lote,
            'factura' => $this->factura,
            'cliente' => $this->cliente?->toArray()
        ];
    }
}