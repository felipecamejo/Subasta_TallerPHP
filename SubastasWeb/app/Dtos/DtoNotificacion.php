<?php

namespace App\DTOs;

class DtoNOtificacion {
    public $id;
    public $mensaje;
    /** @var DtoCliente[] */
    public array $clientes;
    
    public function __construct($id, $mensaje, $clientes) {
        $this->id = $id;
        $this->mensaje = $mensaje;
        $this->clientes = $clientes;
    }

    public function toArray(): array {
        return [
            'id' => $this->id,
            'mensaje' => $this->mensaje,
            'clientes' => array_map(function($cliente) {
                return $cliente->toArray();
            }, $this->clientes)
        ];
    }
}