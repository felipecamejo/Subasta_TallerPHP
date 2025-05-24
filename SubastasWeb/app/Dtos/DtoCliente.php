<?php

namespace App\DTOs;

use App\DTOs\DtoUsuario;

class DtoCliente{
    public $usuario_id;
    public $calificacion;

    public function __construct($usuario_id, $calificacion) {

        $this->usuario_id = $usuario_id;
        $this->calificacion = $calificacion;
    }

    public function toArray(): array {
        return [
            'usuario_id' => $this->usuario_id,
            'calificacion' => $this->calificacion
        ];
    }
}