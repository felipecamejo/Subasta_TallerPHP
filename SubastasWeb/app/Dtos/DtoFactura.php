<?php
namespace App\DTOs;

use App\Models\Factura;
use App\DTOs\DtoVendedor;
use App\DTOs\DtoPuja;

class DtoFactura {
    public $id = null;
    public $montoTotal;
    public $condicionesDePago;
    public $entrega;
    public $vendedorId;
    public $puja = null;

    public function __construct($montoTotal, $condicionesDePago, $entrega, $vendedorId) {
        $this->id = null;
        $this->montoTotal = $montoTotal;
        $this->condicionesDePago = $condicionesDePago;
        $this->entrega = $entrega;
        $this->vendedorId = $vendedorId;
        $this->puja = null;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'montoTotal' => $this->montoTotal,
            'condicionesDePago' => $this->condicionesDePago,
            'entrega' => $this->entrega,
            'vendedorId' => $this->vendedorId,
            'puja' => $this->puja ? $this->puja->toArray() : null
        ];
    }

}