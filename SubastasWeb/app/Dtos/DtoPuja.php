<?php

namespace App\DTOs;

use App\DTOs\DtoCliente;

class DtoPuja {

    public $id;
    public $fechaHora;
    public $monto;
    public $lote;   
    public $factura;
    public $cliente;

    public function __construct($id, $fechaHora, $monto, $lote, $factura, $cliente) {
        $this->id = $id;
        $this->fechaHora = $fechaHora;
        $this->monto = $monto;
        $this->lote_id = $lote;
        $this->factura_id = $factura;
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
            'cliente' => $this->cliente,
        ];
    }






}