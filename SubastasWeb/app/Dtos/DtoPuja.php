<?php

namespace App\DTOs;

use App\DTOs\DtoCliente;

class DtoPuja {

    public $id;
    public $fechaHora;
    public $monto;
    public $lote_id;   
    public $factura_id;

    /** @var DtoCliente[] */
    public array $clientes;

    public function __construct($id, $fechaHora, $monto, $lote_id, $factura_id, $clientes) {
        $this->id = $id;
        $this->fechaHora = $fechaHora;
        $this->monto = $monto;
        $this->lote_id = $lote_id;
        $this->factura_id = $factura_id;
        $this->clientes = $clientes;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'fechaHora' => $this->fechaHora,
            'monto' => $this->monto,
            'lote_id' => $this->lote_id,
            'factura_id' => $this->factura_id,
            'clientes' => array_map(function($cliente) {
                return $cliente->toArray();
            }, $this->clientes)
        ];
    }






}