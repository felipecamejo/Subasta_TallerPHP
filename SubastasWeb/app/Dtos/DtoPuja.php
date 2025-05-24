<?php

namespace App\DTOs;

use App\DTOs\DtoCliente;

class DtoPuja {

    public $id;
    public $fechaHora;
    public $monto;
    public $lote_id;   
    public $facturas_id;

    /** @var DtoCliente[] */
    public array $clientes;



}