<?php
namespace App\DTOs;

use App\Models\Factura;
use App\DTOs\DtoVendedor;
use App\DTOs\DtoPuja;

class DtoFactura {
    public $id;
    public $montoTotal;
    public $condicionesDePago;
    public $entrega;
    public $vendedor;
    public $puja;

    public function __construct($id, $montoTotal, $condicionesDePago, $entrega, $vendedor, $puja) {
        $this->id = $id;
        $this->montoTotal = $montoTotal;
        $this->condicionesDePago = $condicionesDePago;
        $this->entrega = $entrega;
        $this->vendedor = $vendedor;
        $this->puja;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'montoTotal' => $this->montoTotal,
            'condicionesDePago' => $this->condicionesDePago,
            'entrega' => $this->entrega,
            'vendedor' => $this->vendedor,
            'puja' => $this->puja ? $this->puja->toArray() : null
        ];
    }

}