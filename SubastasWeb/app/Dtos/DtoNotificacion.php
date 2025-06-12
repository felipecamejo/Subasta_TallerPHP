<?php

namespace App\DTOs;

class DtoNOtificacion {
    public $id;
    public $titulo;
    public $mensaje;
    public $fechaHora;
    public $esMensajeChat;
    /** @var DtoCliente[] */
    public array $clientes;
    
    public function __construct($id, $titulo, $mensaje, $fechaHora, $esMensajeChat, $clientes) {
        $this->id = $id;
        $this->titulo = $titulo;
        $this->mensaje = $mensaje;
        $this->fechaHora = $fechaHora;
        $this->esMensajeChat = $esMensajeChat;
        $this->clientes = $clientes;
    }

    public function toArray(): array {
        return [
            'id' => $this->id,
            'titulo' => $this->titulo,
            'mensaje' => $this->mensaje,
            'fechaHora' => $this->fechaHora,
            'esMensajeChat' => $this->esMensajeChat,
            'clientes' => array_map(function($cliente) {
                return $cliente->toArray();
            }, $this->clientes)
        ];
    }
}